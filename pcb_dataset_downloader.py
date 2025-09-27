
#!/usr/bin/env python3
"""
PCB Dataset Downloader and Organizer
Helps download and prepare good PCB datasets
"""

import os
import requests
import zipfile
from pathlib import Path
import shutil

class PCBDatasetDownloader:
    def __init__(self, output_dir="good_pcb_dataset"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def download_roboflow_dataset(self, dataset_url, api_key):
        """Download dataset from Roboflow Universe"""
        # Requires roboflow pip package
        try:
            from roboflow import Roboflow
            rf = Roboflow(api_key=api_key)
            project = rf.workspace().project("your-project-name")
            dataset = project.version(1).download("yolov8")
            print(f"Downloaded to: {dataset.location}")
        except ImportError:
            print("Install roboflow: pip install roboflow")
    
    def download_kaggle_dataset(self, dataset_name):
        """Download dataset from Kaggle"""
        # Requires kaggle pip package and API key
        try:
            import kaggle
            kaggle.api.dataset_download_files(
                dataset_name, 
                path=self.output_dir, 
                unzip=True
            )
            print(f"Downloaded {dataset_name} to {self.output_dir}")
        except ImportError:
            print("Install kaggle: pip install kaggle")
            print("Setup API key: https://github.com/Kaggle/kaggle-api")
    
    def organize_good_pcbs(self, source_dir, target_dir="organized_good_pcbs"):
        """Organize downloaded images for training"""
        source_path = Path(source_dir)
        target_path = Path(target_dir)
        
        # Create structure
        (target_path / "train" / "images").mkdir(parents=True, exist_ok=True)
        (target_path / "train" / "labels").mkdir(parents=True, exist_ok=True)
        (target_path / "valid" / "images").mkdir(parents=True, exist_ok=True)
        (target_path / "valid" / "labels").mkdir(parents=True, exist_ok=True)
        
        # Find all image files
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(source_path.rglob(f"*{ext}"))
            image_files.extend(source_path.rglob(f"*{ext.upper()}"))
        
        print(f"Found {len(image_files)} images")
        
        # Split 80/20 train/valid
        train_count = int(len(image_files) * 0.8)
        
        for i, img_file in enumerate(image_files):
            if i < train_count:
                split = "train"
            else:
                split = "valid"
            
            # Copy image
            target_img = target_path / split / "images" / img_file.name
            shutil.copy2(img_file, target_img)
            
            # Create empty label file (good PCB = no defects)
            label_name = img_file.stem + ".txt"
            label_file = target_path / split / "labels" / label_name
            label_file.touch()  # Create empty file
        
        print(f"Organized into:")
        print(f"  Train: {train_count} images")
        print(f"  Valid: {len(image_files) - train_count} images")
        
        # Create data.yaml
        yaml_content = f"""
path: {target_path.absolute()}
train: train/images
val: valid/images

names:
  0: falsecopper
  1: missinghole
  2: mousebite
  3: opencircuit
  4: pinhole
  5: scratch
  6: shortcircuit
  7: spur

# Good PCBs have empty label files (no annotations)
# This represents the "background" or "normal" class
"""
        
        with open(target_path / "data.yaml", "w") as f:
            f.write(yaml_content)
        
        print(f"Created data.yaml in {target_path}")

# Example usage
if __name__ == "__main__":
    downloader = PCBDatasetDownloader()
    
    print("PCB Dataset Downloader")
    print("="*30)
    print("1. Set up your API keys for Roboflow/Kaggle")
    print("2. Use the methods above to download datasets")
    print("3. Use organize_good_pcbs() to prepare for training")
