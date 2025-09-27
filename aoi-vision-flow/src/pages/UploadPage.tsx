import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileImage, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const UploadPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear all previous session data on component mount
  useEffect(() => {
    sessionStorage.removeItem('uploadedFiles');
    sessionStorage.removeItem('inspectionResults');
    // Call backend to clear old files
    fetch('http://localhost:5000/api/cleanup', { method: 'POST' }).catch(() => {
      // Ignore cleanup errors - backend might be offline
    });
  }, []);

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
        description: `${droppedFiles.length} PCB image(s) ready for inspection`,
      });
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      toast({
        title: "Files selected",
        description: `${selectedFiles.length} PCB image(s) ready for inspection`,
      });
    }
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
    
    // Store files for inspection page
    sessionStorage.setItem('uploadedFiles', JSON.stringify(files.map(f => f.name)));
    
    try {
      // Process with YOLOv10 backend
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      const response = await fetch('http://localhost:5000/api/inspect-batch', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('inspectionResults', JSON.stringify(data.results));
        
        // Clear files from state immediately after successful upload
        setFiles([]);
        
        toast({
          title: "Processing Complete",
          description: `${files.length} PCB images processed with YOLOv10`,
        });
      } else {
        // If backend fails, continue with demo data
        toast({
          title: "Using Demo Mode",
          description: "YOLOv10 backend unavailable, showing sample results",
        });
      }
    } catch (error) {
      // If backend fails, continue with demo data
      console.log('Backend unavailable, using demo mode');
      toast({
        title: "Demo Mode",
        description: "Backend unavailable, showing sample inspection results",
      });
    }
    
    navigate('/inspection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              AOI Inspector
            </h1>
            <h2 className="text-3xl font-semibold text-primary mb-6">
              Upload PCB Images for Inspection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Drag and drop your PCB images below or click to browse. Our advanced optical inspection 
              system will analyze each board for defects and quality issues.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="animate-fade-in-up animate-stagger-1">
            <div
              className={`upload-zone p-12 text-center cursor-pointer min-h-[400px] flex flex-col items-center justify-center ${
                isDragOver ? 'border-primary bg-primary/5' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="mb-6">
                <Upload 
                  size={80} 
                  className={`mx-auto mb-4 transition-colors duration-300 ${
                    isDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                />
                <FileImage 
                  size={60} 
                  className={`mx-auto transition-colors duration-300 ${
                    isDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                />
              </div>
              
              <h3 className="text-2xl font-semibold mb-4 text-foreground">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </h3>
              
              <p className="text-lg text-muted-foreground mb-6">
                or <span className="text-primary font-medium">click to browse</span>
              </p>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Supported formats: JPG, PNG, WEBP</p>
                <p>Maximum file size: 20MB per image</p>
              </div>
              
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>

          {/* Uploaded Files Display */}
          {files.length > 0 && (
            <div className="mt-8 animate-fade-in-up animate-stagger-2">
              <div className="industrial-card p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircle className="mr-2 text-success" size={24} />
                  Uploaded Files ({files.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                      <FileImage className="mr-3 text-primary flex-shrink-0" size={20} />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Start Inspection Button */}
          <div className="mt-12 text-center animate-fade-in-up animate-stagger-3">
            <Button
              onClick={startInspection}
              size="lg"
              className="btn-primary px-12 py-4 text-lg font-semibold rounded-xl"
            >
              Start Inspection
              <Upload className="ml-2" size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;