import { useState, useEffect } from 'react';
import { Camera, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import pcbSample1 from '@/assets/pcb-sample-1.png';
import pcbSample2 from '@/assets/pcb-sample-2.png';
import pcbSample3 from '@/assets/pcb-sample-3.png';

interface InspectionResult {
  pcbId: string;
  status: 'PASS' | 'FAIL' | 'QUESTIONABLE';
  defectType: string;
  metrics?: {
    total_defects: number;
  };
  defects_detected?: Array<{
    type: string;
    confidence: number;
    bbox: [number, number, number, number]; // x1, y1, x2, y2
    area: number;
  }>;
  images?: {
    original: string;
    annotated: string;
  };
}

const InspectionPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<InspectionResult[]>([]);
  const [currentPcbIndex, setCurrentPcbIndex] = useState(0);
  const [isInspecting, setIsInspecting] = useState(true);
  const [selectedResult, setSelectedResult] = useState<InspectionResult | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expectedResultCount, setExpectedResultCount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  const pcbImages = [pcbSample1, pcbSample2, pcbSample3];
  
  const sampleResults: InspectionResult[] = [
    { pcbId: 'PCB-001', status: 'PASS', defectType: 'None' },
    { pcbId: 'PCB-002', status: 'FAIL', defectType: 'Solder Bridge' },
    { pcbId: 'PCB-003', status: 'FAIL', defectType: 'Missing Component' },
    { pcbId: 'PCB-004', status: 'PASS', defectType: 'None' },
    { pcbId: 'PCB-005', status: 'FAIL', defectType: 'Cold Joint' },
  ];

  useEffect(() => {
    // Check for YOLOv10 results first
    const storedResults = sessionStorage.getItem('inspectionResults');
    const uploadedFiles = sessionStorage.getItem('uploadedFiles');
    
    // Determine the expected number of results
    let expectedCount = 5; // default fallback
    let resultsToUse = sampleResults; // default to sample results
    
    if (uploadedFiles) {
      const fileList = JSON.parse(uploadedFiles);
      expectedCount = fileList.length;
      
      // If we have YOLOv10 results, use them instead of samples
      if (storedResults) {
        const parsedResults = JSON.parse(storedResults);
        resultsToUse = parsedResults;
        expectedCount = parsedResults.length;
      }
    }
    
    setExpectedResultCount(expectedCount);
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < resultsToUse.length) {
        const nextResult = resultsToUse[currentIndex];
        setResults(prev => {
          const newResults = [...prev, nextResult];
          return newResults;
        });
        setCurrentPcbIndex(prev => (prev + 1) % pcbImages.length);
        setAnimationKey(Date.now()); // Force counter update
        currentIndex++;
      } else {
        setIsInspecting(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []); // Remove dependency to prevent re-running

  // NOTE: Removed automatic backend cleanup on mount.
  // Previous logic called /api/cleanup here, which immediately deleted the freshly
  // generated upload + annotated image files right after navigating from the upload page.
  // That caused 404 errors when opening the details modal later (images already gone).
  // If manual cleanup is needed for a new session, trigger it explicitly from the upload page
  // BEFORE starting a new batch, not after results are produced.

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear session storage when leaving inspection page
      sessionStorage.removeItem('uploadedFiles');
      sessionStorage.removeItem('inspectionResults');
    };
  }, []);

  // Force component update when results change
  useEffect(() => {
    setAnimationKey(Date.now());
  }, [results]);

  const getStatusClass = (status: string) => {
    if (status === 'PASS') return 'status-pass';
    if (status === 'QUESTIONABLE') return 'status-questionable';
    return 'status-fail';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => {
              // Clear all session data before going back
              sessionStorage.removeItem('uploadedFiles');
              sessionStorage.removeItem('inspectionResults');
              // Call backend cleanup
              fetch('http://localhost:5000/api/cleanup', { method: 'POST' }).catch(() => {});
              navigate('/');
            }}
            className="btn-secondary"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Upload
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">AOI Inspector</h1>
            <p className="text-lg text-muted-foreground mt-2">
              {isInspecting ? 'Inspection in Progress...' : 'Inspection Complete'}
            </p>
          </div>
          
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Conveyor Belt Section */}
        <div className="industrial-card p-8 mb-8 animate-fade-in-up">
          <h2 className="text-2xl font-semibold mb-6 text-center">Inspection System</h2>
          
          <div className="relative">
            {/* Inspection Camera */}
            <div className="inspection-camera z-10">
              <Camera size={32} className="text-accent" />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-accent/30 rounded-full"></div>
            </div>
            
            {/* Conveyor Belt */}
            <div className="conveyor-belt h-24 relative rounded-lg" key={animationKey}>
              {/* PCB Items Moving on Belt */}
              {pcbImages.map((image, index) => (
                <div
                  key={`pcb-${index}`}
                  className={`pcb-item ${
                    index === currentPcbIndex && results.length > 0
                      ? results[results.length - 1]?.status === 'PASS'
                        ? 'flash-pass'
                        : results[results.length - 1]?.status === 'QUESTIONABLE'
                        ? 'flash-questionable'
                        : 'flash-fail'
                      : ''
                  }`}
                  style={{
                    animationDelay: `${index * 2.67}s`,
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    animationName: isInspecting ? 'moveLeft' : 'none',
                  }}
                />
              ))}
            </div>
            
            {/* Belt Supports */}
            <div className="flex justify-between mt-4">
              <div className="w-8 h-8 bg-metallic rounded-full"></div>
              <div className="w-8 h-8 bg-metallic rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="industrial-card animate-fade-in-up animate-stagger-1">
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Inspection Results</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">PCB ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Defect Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr
                      key={result.pcbId}
                      className={`${getStatusClass(result.status)} transition-all duration-500 animate-fade-in-up`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="py-4 px-4 font-medium">{result.pcbId}</td>
                      <td className="py-4 px-4">
                        <span className={`font-semibold ${
                          result.status === 'PASS' ? 'text-success' :
                          result.status === 'QUESTIONABLE' ? 'text-warning' :
                          'text-destructive'
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">{result.defectType}</td>
                      <td className="py-4 px-4">
                        {result.metrics || result.defects_detected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedResult(result);
                              setShowDetailsModal(true);
                            }}
                          >
                            View Details
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sample</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Show placeholder rows while inspecting */}
                  {isInspecting && Array.from({ length: expectedResultCount - results.length }).map((_, index) => (
                    <tr key={`pending-${index}`} className="opacity-30">
                      <td className="py-4 px-4">---</td>
                      <td className="py-4 px-4">Inspecting...</td>
                      <td className="py-4 px-4">---</td>
                      <td className="py-4 px-4">---</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Counter Section - Updates automatically */}
            <div className="mt-6 p-4 bg-muted rounded-lg" key={`counter-${animationKey}`}>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-success">
                    {results.filter(r => r.status === 'PASS').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">
                    {results.filter(r => r.status === 'QUESTIONABLE').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Questionable</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">
                    {results.filter(r => r.status === 'FAIL').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{results.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {isInspecting ? `Processing... (${results.length}/${expectedResultCount})` : 'Total'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold">
                    Defect Analysis - {selectedResult.pcbId}
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PCB Image with Bounding Boxes */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">PCB Analysis</h4>
                    {selectedResult.images?.annotated ? (
                      <div className="relative border rounded-lg overflow-hidden">
                        <img
                          src={`http://localhost:5000/api/images/${selectedResult.images.annotated}`}
                          alt={`${selectedResult.pcbId} - Annotated`}
                          className="w-full h-auto max-h-96 object-contain"
                          onError={(e) => {
                            // Fallback to original image if annotated not available
                            if (selectedResult.images?.original) {
                              (e.target as HTMLImageElement).src = 
                                `http://localhost:5000/api/images/${selectedResult.images.original}`;
                            } else {
                              // Show placeholder if no images available
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                            }
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                          {selectedResult.status === 'PASS' ? '✓ PASS' : '✗ FAIL'}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">No image available for this result</p>
                        <p className="text-xs text-gray-400 mt-2">
                          This may be sample data or the image files may have been cleaned up
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Defect Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">Detection Details</h4>
                    
                    {/* Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-2 font-bold ${
                            selectedResult.status === 'PASS' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedResult.status}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Primary Defect:</span>
                          <span className="ml-2">{selectedResult.defectType}</span>
                        </div>
                        <div>
                          <span className="font-medium">Total Defects:</span>
                          <span className="ml-2">
                            {selectedResult.metrics?.total_defects || selectedResult.defects_detected?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* YOLOv10 Model Analysis */}
                    {selectedResult.metrics && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Model Analysis</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Defects Detected:</span>
                            <span className="font-medium">{selectedResult.metrics.total_defects || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Model Confidence Threshold:</span>
                            <span className="font-medium">0.25</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Detection Model:</span>
                            <span className="font-medium">YOLOv10</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Individual Defects */}
                    {selectedResult.defects_detected && selectedResult.defects_detected.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Detected Defects</h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedResult.defects_detected.map((defect, index) => (
                            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium text-red-900">
                                    {defect.type.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <div className="text-sm text-red-700 mt-1">
                                    Confidence: {(defect.confidence * 100).toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-red-700">
                                    Area: {defect.area.toFixed(0)}px²
                                  </div>
                                </div>
                                <div className="text-xs text-red-600">
                                  Box: [{defect.bbox[0].toFixed(0)}, {defect.bbox[1].toFixed(0)}, {defect.bbox[2].toFixed(0)}, {defect.bbox[3].toFixed(0)}]
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View Original Image Button */}
                    {selectedResult.images?.original && (
                      <Button
                        variant="outline"
                        className="w-full mb-2"
                        onClick={() => window.open(
                          `http://localhost:5000/api/images/${selectedResult.images?.original}`, 
                          '_blank'
                        )}
                      >
                        View Original Image
                      </Button>
                    )}
                    

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionPage;