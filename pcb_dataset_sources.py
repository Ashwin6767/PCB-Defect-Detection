#!/usr/bin/env python3
"""
PCB Dataset Sources and Download Helper
Guide to finding and downloading good PCB datasets
"""

def academic_pcb_datasets():
    """List of academic PCB datasets with good samples"""
    
    datasets = {
        "DeepPCB Dataset": {
            "url": "https://github.com/tangsanli5201/DeepPCB",
            "description": "6 types of PCB defects + normal samples",
            "images": "~1700 images",
            "format": "YOLO format",
            "license": "Open source",
            "good_samples": "Yes - includes normal PCBs"
        },
        
        "PCB-DATASET (GitHub)": {
            "url": "https://github.com/Ixiaohuihuihui/PCB-DATASET",
            "description": "Multiple PCB defect types with normal samples",
            "images": "~2000+ images",
            "format": "Various formats",
            "license": "Academic use",
            "good_samples": "Yes"
        },
        
        "PKU-Market PCB": {
            "url": "https://robotics.pkusz.edu.cn/resources/dataset/",
            "description": "Peking University PCB dataset",
            "images": "~5000+ images",
            "format": "Custom format",
            "license": "Academic use",
            "good_samples": "Yes - normal PCB samples included"
        },
        
        "IEEE DataPort PCB Datasets": {
            "url": "https://ieee-dataport.org/",
            "description": "Search for PCB, electronics, manufacturing",
            "images": "Variable",
            "format": "Various",
            "license": "IEEE membership may be required",
            "good_samples": "Dataset dependent"
        }
    }
    
    return datasets

def industrial_pcb_sources():
    """Industrial and manufacturing dataset sources"""
    
    sources = {
        "Manufacturing.gov Open Data": {
            "url": "https://www.manufacturing.gov/",
            "description": "US government manufacturing datasets",
            "note": "Search for electronics, quality control"
        },
        
        "European Manufacturing Data": {
            "url": "https://ec.europa.eu/digital-single-market/en/open-data",
            "description": "EU open manufacturing data",
            "note": "Look for Industry 4.0 datasets"
        },
        
        "Synthetic PCB Generators": {
            "description": "Generate your own good PCBs",
            "tools": ["KiCad", "Eagle CAD", "Altium Designer"],
            "note": "Create clean PCB layouts and render them"
        }
    }
    
    return sources

def create_dataset_download_script():
    """Script to help download and organize PCB datasets"""
    
    script = '''
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
'''
    
    return script

def synthetic_pcb_generation_guide():
    """Guide for generating synthetic good PCBs"""
    
    guide = """
    🔧 SYNTHETIC GOOD PCB GENERATION
    ================================
    
    If you can't find enough real good PCBs, generate synthetic ones:
    
    1. USE KICAD (Free PCB Design Software):
       - Download: https://www.kicad.org/
       - Create simple PCB layouts
       - Export as high-res images (PNG/JPG)
       - Vary: components, traces, sizes, colors
    
    2. PCB LAYOUT GENERATORS:
       - Use online PCB generators
       - Modify existing open-source PCB designs
       - GitHub: search "PCB layout" "KiCad projects"
    
    3. RENDERING VARIATIONS:
       - Different lighting angles
       - Various backgrounds
       - Different resolutions
       - Color variations (green, blue, red solder mask)
    
    4. AUGMENTATION:
       - Rotate, flip, scale generated PCBs
       - Add realistic manufacturing variations
       - Slight color/brightness changes
    
    TARGET: Generate 3500+ synthetic good PCBs
    """
    
    return guide

def main():
    print("🔍 PCB DATASET SOURCES FOR GOOD/UNDEFECTIVE PCBs")
    print("="*60)
    
    print("\n📚 ACADEMIC DATASETS:")
    datasets = academic_pcb_datasets()
    for name, info in datasets.items():
        print(f"\n{name}:")
        for key, value in info.items():
            print(f"  {key}: {value}")
    
    print("\n🏭 INDUSTRIAL SOURCES:")
    sources = industrial_pcb_sources()
    for name, info in sources.items():
        print(f"\n{name}:")
        for key, value in info.items():
            print(f"  {key}: {value}")
    
    print(f"\n{synthetic_pcb_generation_guide()}")
    
    # Create helper script
    script_content = create_dataset_download_script()
    with open("pcb_dataset_downloader.py", "w") as f:
        f.write(script_content)
    
    print("\n📁 Created helper script: pcb_dataset_downloader.py")
    print("\n🎯 RECOMMENDED APPROACH:")
    print("1. Try Roboflow Universe first (easiest)")
    print("2. Check Kaggle for competition datasets")
    print("3. Use academic datasets as backup")
    print("4. Generate synthetic PCBs if needed")

if __name__ == "__main__":
    main()
    