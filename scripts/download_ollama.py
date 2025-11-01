#!/usr/bin/env python3
"""
Ollama Model Downloader for Llama Wrangler
Downloads models directly from Ollama's registry without requiring Ollama installation
"""

import os
import sys
import json
import requests
import hashlib
import subprocess
import shutil
from pathlib import Path
from typing import Optional, Dict, Any

def print_progress(message):
    """Print progress messages that the Electron app can parse"""
    print(message, flush=True)

class OllamaDownloader:
    """Downloads models from Ollama's registry"""
    
    REGISTRY_URL = "https://registry.ollama.ai"
    API_URL = "https://ollama.ai/api"
    
    def __init__(self, llama_cpp_path: Optional[str] = None):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Llama-Wrangler/1.0'
        })
        self.llama_cpp_path = self._find_llama_cpp(llama_cpp_path)
    
    def _find_llama_cpp(self, custom_path: Optional[str] = None) -> Optional[Path]:
        """Find llama.cpp installation"""
        if custom_path:
            path = Path(custom_path)
            if path.exists():
                return path
        
        # Check common locations - SAME AS HUGGINGFACE SCRIPT
        home = Path.home()
        paths_to_check = [
            home / ".llama-wrangler" / "llama.cpp",
            home / ".METALlama.cpp",  # METALlama installation
            Path.cwd() / "llama.cpp",
            home / "llama.cpp",
            Path("/usr/local/llama.cpp"),
        ]
        
        for path in paths_to_check:
            if path.exists():
                return path
        
        return None
    
    def parse_model_name(self, model_name: str) -> tuple[str, str]:
        """Parse model name into namespace/model:tag format"""
        # Default namespace is 'library'
        if '/' not in model_name:
            model_name = f"library/{model_name}"
        
        # Default tag is 'latest'
        if ':' not in model_name:
            model_name = f"{model_name}:latest"
            
        return model_name.split(':')
    
    def get_manifest(self, model_path: str, tag: str) -> Dict[str, Any]:
        """Fetch the model manifest from Ollama registry"""
        manifest_url = f"{self.REGISTRY_URL}/v2/{model_path}/manifests/{tag}"
        
        print_progress(f"Fetching manifest for {model_path}:{tag}")
        
        try:
            response = self.session.get(manifest_url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise Exception(f"Model '{model_path}:{tag}' not found in Ollama registry")
            else:
                raise Exception(f"Failed to fetch manifest: {e}")
    
    def find_model_layer(self, manifest: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find the model layer in the manifest"""
        if 'layers' not in manifest:
            raise Exception("Invalid manifest: no layers found")
        
        # Look for the model layer (usually the largest one)
        model_layer = None
        max_size = 0
        
        for layer in manifest['layers']:
            if layer.get('mediaType') == 'application/vnd.ollama.image.model':
                if layer.get('size', 0) > max_size:
                    max_size = layer['size']
                    model_layer = layer
        
        if not model_layer:
            # Fallback: just get the largest layer
            for layer in manifest['layers']:
                if layer.get('size', 0) > max_size:
                    max_size = layer['size']
                    model_layer = layer
        
        return model_layer
    
    def download_blob(self, model_path: str, digest: str, size: int, output_path: str) -> str:
        """Download a blob from the registry"""
        blob_url = f"{self.REGISTRY_URL}/v2/{model_path}/blobs/{digest}"
        
        print_progress(f"Downloading model ({size / 1e9:.2f} GB)")
        
        response = self.session.get(blob_url, stream=True)
        response.raise_for_status()
        
        downloaded = 0
        chunk_size = 8192
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    percentage = int((downloaded / size) * 100)
                    print_progress(f"{percentage}%")
        
        return output_path
    
    def verify_download(self, file_path: str, expected_digest: str) -> bool:
        """Verify the downloaded file matches the expected digest"""
        print_progress("Verifying download...")
        
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        actual_digest = f"sha256:{sha256_hash.hexdigest()}"
        return actual_digest == expected_digest
    
    def quantize_model(self, gguf_path: str, quantization: str) -> str:
        """Quantize GGUF model - EXACT COPY FROM HUGGINGFACE SCRIPT"""
        if not self.llama_cpp_path:
            print_progress(f"Warning: llama.cpp not found, skipping quantization to {quantization}")
            return gguf_path
        
        # EXACT SAME PATHS AS HUGGINGFACE
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
        
        input_path = Path(gguf_path)
        output_path = input_path.parent / f"{input_path.stem}-{quantization}.gguf"
        
        # EXACT SAME ENV SETUP AS HUGGINGFACE
        env = os.environ.copy()
        lib_path = self.llama_cpp_path / "build"
        if lib_path.exists():
            env['DYLD_LIBRARY_PATH'] = str(lib_path)
        
        cmd = [str(quantize_path), str(gguf_path), str(output_path), quantization]
        print_progress(f"Quantizing model to {quantization}")
        
        try:
            print_progress(f"Running quantize command: {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, env=env, capture_output=True, text=True)
            print_progress(f"Quantize stdout: {result.stdout[:200] if result.stdout else 'none'}")
            print_progress(f"Model quantized to {quantization}")
            # Remove original to save space
            if output_path.exists():
                print_progress(f"Quantized file exists, removing original: {gguf_path}")
                os.remove(gguf_path)
                print_progress("Original removed successfully")
            else:
                print_progress(f"WARNING: Quantized file does not exist at {output_path}")
            return str(output_path)
        except subprocess.CalledProcessError as e:
            print_progress(f"Quantization failed: {e}")
            if e.stderr:
                print_progress(f"Stderr: {e.stderr}")
            return gguf_path
    
    def download_model(self, model_name: str, output_dir: str, quantization: Optional[str] = None) -> str:
        """Download an Ollama model and save as GGUF"""
        model_path, tag = self.parse_model_name(model_name)
        
        # Get manifest
        manifest = self.get_manifest(model_path, tag)
        
        # Find model layer
        model_layer = self.find_model_layer(manifest)
        if not model_layer:
            raise Exception("No model layer found in manifest")
        
        # Prepare output filename
        safe_name = model_name.replace('/', '_').replace(':', '_')
        
        # Check if quantized version already exists
        if quantization:
            quantized_path = os.path.join(output_dir, f"{safe_name}-{quantization}.gguf")
            if os.path.exists(quantized_path):
                print_progress(f"Quantized model already exists at {quantized_path}")
                return quantized_path
            
            # Also check if original exists and already has quantization in name
            original_path = os.path.join(output_dir, f"{safe_name}.gguf")
            if os.path.exists(original_path):
                print_progress(f"Found existing model at {original_path}, will quantize to {quantization}")
                return self.quantize_model(original_path, quantization)
        
        output_path = os.path.join(output_dir, f"{safe_name}.gguf")
        
        # Check if already downloaded
        if os.path.exists(output_path):
            print_progress(f"Model already exists at {output_path}")
            # Verify it's valid
            if self.verify_download(output_path, model_layer['digest']):
                print_progress("Existing model verified")
                # Quantize if needed
                if quantization:
                    return self.quantize_model(output_path, quantization)
                return output_path
            else:
                print_progress("Existing model corrupt, re-downloading")
                os.remove(output_path)
        
        # Download the model
        self.download_blob(
            model_path,
            model_layer['digest'],
            model_layer['size'],
            output_path
        )
        
        # Verify download
        if not self.verify_download(output_path, model_layer['digest']):
            os.remove(output_path)
            raise Exception("Downloaded file is corrupt")
        
        print_progress("Download verified")
        
        # Quantize if requested
        if quantization:
            return self.quantize_model(output_path, quantization)
        
        return output_path

def main():
    if len(sys.argv) < 3:
        print("Usage: download_ollama.py <model_name> <output_dir> [quantization]")
        sys.exit(1)
    
    model_name = sys.argv[1]
    output_dir = sys.argv[2]
    quantization = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        downloader = OllamaDownloader()
        output_path = downloader.download_model(model_name, output_dir, quantization)
        
        print_progress("100%")
        print_progress(f"Model saved to: {output_path}")
        if quantization:
            print_progress(f"Model quantized to {quantization}")
        print_progress("Download complete!")
        
    except Exception as e:
        print_progress(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()