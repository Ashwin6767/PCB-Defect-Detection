import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const UploadPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      toast({
        title: "Files uploaded successfully",
        description: `${droppedFiles.length} PCB image(s) ready for YOLOv10 inspection`,
      });
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      toast({
        title: "Files selected",
        description: `${selectedFiles.length} PCB image(s) ready for YOLOv10 inspection`,
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startInspection = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload PCB images before starting inspection",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Process files with YOLOv10 backend
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file);
      });
      
      const response = await fetch('http://localhost:5000/api/inspect-batch', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to process images');
      }
      
      const data = await response.json();
      
      // Store results and navigate to inspection page
      sessionStorage.setItem('inspectionResults', JSON.stringify(data.results));
      sessionStorage.setItem('uploadedFiles', JSON.stringify(files.map(f => f.name)));
      
      toast({
        title: "Inspection Started",
        description: `Processing ${files.length} PCB images with YOLOv10 model`,
      });
      
      navigate('/inspection');
      
    } catch (error) {
      console.error('Inspection error:', error);
      toast({
        title: "Inspection Failed",
        description: "Failed to connect to YOLOv10 backend. Make sure the server is running.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            YOLOv10 PCB AOI Inspection
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload PCB images for automated defect detection using our trained YOLOv10 model. 
            Detects 8 types of defects: falsecopper, missinghole, mousebite, opencircuit, pinhole, scratch, shortcircuit, and spur.
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center mb-8 transition-all duration-300 ${
            isDragOver
              ? 'border-primary bg-primary/5 scale-105'
              : 'border-gray-300 hover:border-primary/50 hover:bg-primary/2'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Drag & Drop PCB Images Here
          </h3>
          <p className="text-gray-500 mb-6">
            or click to select files from your computer
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer">
              Select PCB Images
            </Button>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileImage className="mr-2 h-5 w-5" />
              Selected PCB Images ({files.length})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileImage className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            YOLOv10 Model Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Model Accuracy:</p>
              <p className="text-gray-600">mAP@0.5: 94.97%</p>
            </div>
            <div>
              <p className="font-medium">Inference Speed:</p>
              <p className="text-gray-600">~53ms per image</p>
            </div>
            <div>
              <p className="font-medium">Defect Classes:</p>
              <p className="text-gray-600">8 types detected</p>
            </div>
            <div>
              <p className="font-medium">Dataset Size:</p>
              <p className="text-gray-600">7,450 training images</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={startInspection} 
            size="lg" 
            disabled={files.length === 0 || isProcessing}
            className="px-8 py-3"
          >
            {isProcessing ? (
              <>
                <AlertCircle className="mr-2 h-5 w-5 animate-spin" />
                Processing with YOLOv10...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Start AOI Inspection ({files.length} images)
              </>
            )}
          </Button>
          
          {files.length > 0 && (
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setFiles([])}
              disabled={isProcessing}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            Instructions:
          </h3>
          <ul className="space-y-2 text-blue-700">
            <li>• Upload PCB images in JPG, PNG, or other common formats</li>
            <li>• Ensure images are clear and well-lit for best results</li>
            <li>• The YOLOv10 model will analyze each image for defects</li>
            <li>• Results will show PASS/FAIL status with confidence scores</li>
            <li>• Detected defects will be highlighted with bounding boxes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;