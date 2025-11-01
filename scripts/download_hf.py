#!/usr/bin/env python3
"""
HuggingFace to GGUF Auto-Converter for Llama Wrangler
Automatically downloads and converts HuggingFace models to GGUF format with progress tracking
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List
import shutil
import requests
from urllib.parse import quote

try:
    from huggingface_hub import snapshot_download, hf_hub_download
    from tqdm import tqdm
except ImportError:
    print("Error: Required packages not installed. Run: pip install huggingface-hub tqdm")
    sys.exit(1)


def print_progress(message):
    """Print progress messages that the Electron app can parse"""
    print(message, flush=True)


class ProgressCallback:
    """Callback for tracking download progress"""
    def __init__(self):
        self.pbar = None
        self.last_percentage = 0
    
    def __call__(self, bytes_downloaded, total_bytes):
        if total_bytes > 0:
            percentage = int((bytes_downloaded / total_bytes) * 100)
            if percentage != self.last_percentage:
                print_progress(f"{percentage}%")
                self.last_percentage = percentage


class ModelConverter:
    """Handles model identification and conversion to GGUF"""
    
    # Common model architectures and their conversion scripts
    ARCHITECTURE_MAP = {
        "LlamaForCausalLM": "convert-hf-to-gguf.py",
        "MistralForCausalLM": "convert-hf-to-gguf.py", 
        "MixtralForCausalLM": "convert-hf-to-gguf.py",
        "Qwen2ForCausalLM": "convert-hf-to-gguf.py",
        "GemmaForCausalLM": "convert-hf-to-gguf.py",
        "Phi3ForCausalLM": "convert-hf-to-gguf.py",
        "StableLMForCausalLM": "convert-hf-to-gguf.py",
        "GPT2LMHeadModel": "convert-hf-to-gguf.py",
        "GPTNeoXForCausalLM": "convert-hf-to-gguf.py",
        "FalconForCausalLM": "convert-falcon-hf-to-gguf.py",
        "BaichuanForCausalLM": "convert-baichuan-hf-to-gguf.py",
        "PersimmonForCausalLM": "convert-persimmon-hf-to-gguf.py",
        "StableLmForCausalLM": "convert-stablelm-hf-to-gguf.py",
        "QWenLMHeadModel": "convert-qwen-hf-to-gguf.py",
        "MptForCausalLM": "convert-hf-to-gguf.py",
        "BloomForCausalLM": "convert-bloom-hf-to-gguf.py",
    }
    
    # Popular quantization formats
    PREFERRED_QUANTS = ["Q4_K_M", "Q4_K", "Q5_K_M", "Q5_K", "Q3_K_M", "Q6_K", "Q8_0"]
    
    def __init__(self, llama_cpp_path: Optional[str] = None):
        """Initialize converter"""
        self.llama_cpp_path = self._find_llama_cpp(llama_cpp_path)
        if not self.llama_cpp_path:
            raise RuntimeError("llama.cpp not found. Please ensure llama.cpp is installed.")
    
    def _find_llama_cpp(self, custom_path: Optional[str] = None) -> Optional[Path]:
        """Find llama.cpp installation"""
        if custom_path:
            path = Path(custom_path)
            if path.exists() and self._has_converter_scripts(path):
                return path
        
        # Check common locations
        home = Path.home()
        locations = [
            home / ".llama-wrangler" / "llama.cpp",
            home / ".METALlama.cpp",
            Path.cwd() / "llama.cpp",
            home / "llama.cpp",
            Path("/usr/local/llama.cpp"),
        ]
        
        for loc in locations:
            if loc.exists() and self._has_converter_scripts(loc):
                return loc
        
        return None
    
    def _has_converter_scripts(self, path: Path) -> bool:
        """Check if the path has converter scripts"""
        return any((
            (path / "convert-hf-to-gguf.py").exists(),
            (path / "convert_hf_to_gguf.py").exists(),
            (path / "convert.py").exists()
        ))
    
    def extract_repo_info(self, url: str) -> tuple[str, str, str]:
        """Extract repo_id, revision, and specific file from HuggingFace URL"""
        url = url.strip().rstrip('/')
        specific_file = None
        
        if "huggingface.co/" in url:
            parts = url.split("huggingface.co/")[-1].split("/")
            if len(parts) >= 2:
                repo_id = f"{parts[0]}/{parts[1]}"
                
                # Check if URL points to a specific GGUF file
                if ("blob/" in url or "tree/" in url) and url.endswith('.gguf'):
                    specific_file = url.split('/')[-1]
                
                # Extract revision
                if "tree/" in url:
                    revision = url.split("tree/")[-1].split("/")[0]
                elif "blob/" in url:
                    revision = url.split("blob/")[-1].split("/")[0]
                else:
                    revision = "main"
                    
                return repo_id, revision, specific_file
        
        return url, "main", None
    
    def check_for_gguf_files(self, repo_id: str, preferred_quant: str = "Q4_K_M") -> List[str]:
        """Check if model has pre-converted GGUF files"""
        api_url = f"https://huggingface.co/api/models/{repo_id}/tree/main"
        
        try:
            headers = {}
            hf_token = os.environ.get('HF_TOKEN') or os.environ.get('HUGGING_FACE_HUB_TOKEN')
            if hf_token:
                headers['Authorization'] = f'Bearer {hf_token}'
            
            response = requests.get(api_url, timeout=10, headers=headers)
            if response.status_code == 200:
                files = response.json()
                gguf_files = []
                
                # Collect all GGUF files
                for file in files:
                    if file['path'].endswith('.gguf') and 'ggml-vocab' not in file['path']:
                        gguf_files.append(file['path'])
                
                # Sort by preference
                def quant_priority(filename):
                    for i, quant in enumerate(self.PREFERRED_QUANTS):
                        if quant.lower() in filename.lower():
                            return i
                    return len(self.PREFERRED_QUANTS)
                
                gguf_files.sort(key=quant_priority)
                return gguf_files[:5]  # Return top 5 options
        except Exception as e:
            print_progress(f"Error checking for GGUF files: {e}")
        
        return []
    
    def download_gguf_direct(self, repo_id: str, file_path: str, output_dir: str) -> str:
        """Download a GGUF file directly with progress"""
        url = f"https://huggingface.co/{repo_id}/resolve/main/{quote(file_path)}"
        filename = os.path.basename(file_path)
        dest_path = os.path.join(output_dir, filename)
        
        print_progress(f"Downloading {filename}...")
        
        headers = {}
        hf_token = os.environ.get('HF_TOKEN') or os.environ.get('HUGGING_FACE_HUB_TOKEN')
        if hf_token:
            headers['Authorization'] = f'Bearer {hf_token}'
            print_progress("Using HuggingFace token for authentication")
        
        response = requests.get(url, stream=True, allow_redirects=True, headers=headers)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        if total_size == 0:
            print_progress("Warning: Unknown file size, progress may not be accurate")
            total_size = 1
        
        downloaded = 0
        last_percentage = -1
        chunk_size = 1024 * 1024  # 1MB chunks
        
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    percentage = int((downloaded / total_size) * 100) if total_size > 1 else 0
                    if percentage != last_percentage:
                        print_progress(f"{percentage}%")
                        last_percentage = percentage
        
        print_progress(f"Downloaded to {dest_path}")
        return dest_path
    
    def download_model(self, repo_id: str, revision: str = "main", 
                      output_dir: Optional[str] = None) -> Path:
        """Download model from HuggingFace with progress tracking"""
        if not output_dir:
            output_dir = f"./models/{repo_id.replace('/', '_')}"
        
        temp_dir = os.path.join(output_dir, f"temp_{repo_id.replace('/', '_')}")
        
        print_progress(f"Downloading {repo_id} (revision: {revision})")
        print_progress("10%")
        
        try:
            file_count = 0
            def progress_callback(filename):
                nonlocal file_count
                file_count += 1
                progress = 10 + min(30, (file_count * 30) // 100)
                print_progress(f"{progress}%")
            
            local_dir = snapshot_download(
                repo_id=repo_id,
                revision=revision,
                local_dir=temp_dir,
                ignore_patterns=["*.bin", "*.safetensors.index.json", "*.h5", "*.msgpack", 
                               "*.ot", "*.pt", "*.pth"],
                resume_download=True,
                max_workers=2
            )
            print_progress("40%")
            return Path(local_dir)
        except Exception as e:
            print_progress(f"Error downloading model: {e}")
            raise
    
    def identify_architecture(self, model_path: Path) -> Optional[str]:
        """Identify model architecture from config.json"""
        config_path = model_path / "config.json"
        if not config_path.exists():
            return None
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            architectures = config.get("architectures", [])
            if architectures:
                arch = architectures[0]
                print_progress(f"Detected architecture: {arch}")
                return arch
            
            model_type = config.get("model_type", "")
            if model_type:
                print_progress(f"Using model_type: {model_type}")
                return model_type
            
        except Exception as e:
            print_progress(f"Error reading config.json: {e}")
        
        return None
    
    def get_conversion_script(self, architecture: str) -> str:
        """Get appropriate conversion script for architecture"""
        if architecture in self.ARCHITECTURE_MAP:
            return self.ARCHITECTURE_MAP[architecture]
        
        # Fuzzy matching
        arch_lower = architecture.lower()
        if any(x in arch_lower for x in ["llama", "mistral", "qwen", "gemma"]):
            return "convert-hf-to-gguf.py"
        elif "falcon" in arch_lower:
            return "convert-falcon-hf-to-gguf.py"
        elif "baichuan" in arch_lower:
            return "convert-baichuan-hf-to-gguf.py"
        elif "bloom" in arch_lower:
            return "convert-bloom-hf-to-gguf.py"
        
        return "convert-hf-to-gguf.py"
    
    def find_conversion_script(self, script_name: str) -> Optional[Path]:
        """Find the conversion script with flexible naming"""
        possible_names = [
            script_name,
            script_name.replace('-', '_'),
            script_name.replace('_', '-'),
            "convert-hf-to-gguf.py",
            "convert_hf_to_gguf.py",
            "convert.py"
        ]
        
        for name in possible_names:
            script_path = self.llama_cpp_path / name
            if script_path.exists():
                return script_path
        
        return None
    
    def convert_to_gguf(self, model_path: Path, output_path: Optional[str] = None,
                       quantization: Optional[str] = None) -> Path:
        """Convert model to GGUF format with progress tracking"""
        architecture = self.identify_architecture(model_path)
        if not architecture:
            print_progress("Warning: Could not identify architecture, using default converter")
            architecture = "LlamaForCausalLM"
        
        script_name = self.get_conversion_script(architecture)
        script_path = self.find_conversion_script(script_name)
        
        if not script_path:
            raise RuntimeError(f"No conversion script found in {self.llama_cpp_path}")
        
        if not output_path:
            output_path = str(model_path.parent / f"{model_path.name}.gguf")
        
        cmd = [sys.executable, str(script_path), str(model_path), "--outfile", output_path]
        
        # Don't add vocab-type for convert_hf_to_gguf.py as it doesn't support it
        
        print_progress(f"Converting model using {script_path.name}")
        print_progress("50%")
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print_progress("75%")
            
            if quantization:
                return self.quantize_model(Path(output_path), quantization)
            
            return Path(output_path)
            
        except subprocess.CalledProcessError as e:
            print_progress(f"Conversion failed: {e}")
            if e.stderr:
                print_progress(f"Error details: {e.stderr}")
            raise
    
    def quantize_model(self, gguf_path: Path, quantization: str) -> Path:
        """Quantize GGUF model with progress tracking"""
        possible_paths = [
            self.llama_cpp_path / "build" / "bin" / "llama-quantize",
            self.llama_cpp_path / "llama-quantize",
            self.llama_cpp_path / "quantize"
        ]
        
        quantize_path = None
        for path in possible_paths:
            if path.exists():
                quantize_path = path
                break
        
        if not quantize_path:
            print_progress("Warning: quantize tool not found, skipping quantization")
            return gguf_path
        
        output_path = gguf_path.parent / f"{gguf_path.stem}-{quantization}.gguf"
        
        # Set up environment with library path for quantization
        env = os.environ.copy()
        lib_path = self.llama_cpp_path / "build"
        if lib_path.exists():
            env['DYLD_LIBRARY_PATH'] = str(lib_path)
        
        cmd = [str(quantize_path), str(gguf_path), str(output_path), quantization]
        print_progress(f"Quantizing model to {quantization}")
        print_progress("85%")
        
        try:
            subprocess.run(cmd, check=True, env=env)
            print_progress("95%")
            return output_path
        except subprocess.CalledProcessError as e:
            print_progress(f"Quantization failed: {e}")
            return gguf_path


def main():
    if len(sys.argv) < 4:
        print("Usage: download_hf.py <model_id> <output_dir> <quantization>")
        sys.exit(1)
    
    model_id = sys.argv[1]
    output_dir = sys.argv[2]
    quantization = sys.argv[3]
    
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        converter = ModelConverter()
        repo_id, revision, specific_file = converter.extract_repo_info(model_id)
        
        print_progress(f"Debug: model_id = {model_id}")
        print_progress(f"Debug: repo_id = {repo_id}")
        print_progress(f"Debug: revision = {revision}")
        print_progress(f"Debug: specific_file = {specific_file}")
        
        if specific_file:
            print_progress(f"Downloading specific file: {specific_file}")
            final_path = converter.download_gguf_direct(repo_id, specific_file, output_dir)
            print_progress("100%")
            print_progress("Download complete!")
        else:
            print_progress(f"Checking {repo_id} for GGUF files...")
            
            # Check for pre-converted GGUF files
            gguf_files = converter.check_for_gguf_files(repo_id, quantization)
            
            if gguf_files:
                print_progress(f"Found {len(gguf_files)} compatible GGUF files")
                # Select best match for requested quantization
                selected_file = None
                for file in gguf_files:
                    if quantization.lower() in file.lower():
                        selected_file = file
                        break
                if not selected_file:
                    selected_file = gguf_files[0]
                
                print_progress(f"Downloading {selected_file}")
                final_path = converter.download_gguf_direct(repo_id, selected_file, output_dir)
                print_progress("100%")
                print_progress("Download complete!")
            else:
                print_progress("No pre-quantized GGUF files found")
                print_progress("Downloading base model for local conversion...")
                
                try:
                    model_path = converter.download_model(repo_id, revision, output_dir)
                    print_progress("Base model downloaded, converting to GGUF...")
                except Exception as e:
                    print_progress(f"Error downloading base model: {str(e)}")
                    print_progress("The model may be too large or require authentication")
                    sys.exit(1)
                
                gguf_path = converter.convert_to_gguf(model_path, quantization=quantization)
                print_progress("100%")
                if quantization and not gguf_path.name.endswith(f"-{quantization}.gguf"):
                    print_progress("Model converted successfully! (Quantization optional)")
                else:
                    print_progress("Model converted and quantized successfully!")
                
                # Clean up temporary files
                if model_path.exists() and model_path.is_dir():
                    shutil.rmtree(model_path)
                    print_progress("Cleaned up temporary files")
        
    except Exception as e:
        print_progress(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()