import { useState, useEffect } from 'react';
import { Camera, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface InspectionResult {
  pcbId: string;
  status: 'PASS' | 'FAIL' | 'QUESTIONABLE' | 'ERROR';
  defectType: string;
  confidence: number;
  timestamp: string;
  metrics?: {
    total_defects: number;
    high_confidence_defects: number;
    defect_area_ratio: number;
    ensemble_score: number;
  };
  defects_detected?: Array<{
    type: string;
    confidence: number;
    bbox: number[];
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<InspectionResult | null>(null);

  useEffect(() => {
    // Load results from sessionStorage (set by UploadPage)
    const storedResults = sessionStorage.getItem('inspectionResults');

    if (storedResults) {
      const parsedResults: InspectionResult[] = JSON.parse(storedResults);

      // Simulate real-time processing display
      let index = 0;
      const interval = setInterval(() => {
        if (index < parsedResults.length) {
          setResults(prev => [...prev, parsedResults[index]]);
          setCurrentIndex(index);
          index++;
        } else {
          setIsLoading(false);
          clearInterval(interval);
        }
      }, 1500); // Show one result every 1.5 seconds

      return () => clearInterval(interval);
    } else {
      // No results found, redirect back to upload
      navigate('/');
    }
  }, [navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'QUESTIONABLE':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <XCircle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAIL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'QUESTIONABLE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const questionableCount = results.filter(r => r.status === 'QUESTIONABLE').length;
  const totalProcessed = results.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              YOLOv10 AOI Inspection Results
            </h1>
            <p className="text-gray-600">
              Real-time PCB defect detection using trained YOLOv10 model
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Upload
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900">{totalProcessed}</p>
              </div>
              <Camera className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">{passCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Questionable</p>
                <p className="text-2xl font-bold text-yellow-600">{questionableCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Results List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Inspection Results
              {isLoading && (
                <span className="ml-2 text-sm text-blue-600">Processing...</span>
              )}
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={result.pcbId}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedResult?.pcbId === result.pcbId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-medium text-gray-800">{result.pcbId}</h3>
                        <p className="text-sm text-gray-600">
                          {result.defectType} • {formatTimestamp(result.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass(result.status)}`}>
                        {result.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.confidence}% confidence
                      </p>
                    </div>
                  </div>

                  {result.metrics && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <span>Defects: {result.metrics.total_defects}</span>
                      <span>Score: {result.metrics.ensemble_score}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed View */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Detailed Analysis
            </h2>

            {selectedResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{selectedResult.pcbId}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass(selectedResult.status)}`}>
                    {selectedResult.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Primary Defect:</p>
                    <p className="text-gray-600">{selectedResult.defectType}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Confidence:</p>
                    <p className="text-gray-600">{selectedResult.confidence}%</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Processed:</p>
                    <p className="text-gray-600">{formatTimestamp(selectedResult.timestamp)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Total Defects:</p>
                    <p className="text-gray-600">
                      {selectedResult.metrics?.total_defects || 0}
                    </p>
                  </div>
                </div>

                {selectedResult.metrics && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">YOLOv10 Metrics:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>High Conf. Detections: {selectedResult.metrics.high_confidence_defects}</span>
                      <span>Area Coverage: {(selectedResult.metrics.defect_area_ratio * 100).toFixed(2)}%</span>
                      <span>Ensemble Score: {selectedResult.metrics.ensemble_score}</span>
                    </div>
                  </div>
                )}

                {selectedResult.defects_detected && selectedResult.defects_detected.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Detected Defects:</h4>
                    <div className="space-y-2">
                      {selectedResult.defects_detected.map((defect, index) => (
                        <div key={index} className="bg-red-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-red-800">
                              {defect.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-red-600">
                              {(defect.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-red-600 text-xs mt-1">
                            Area: {defect.area.toFixed(0)}px²
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedResult.images && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`http://localhost:5000/api/images/${selectedResult.images?.annotated}`, '_blank')}
                    >
                      View Annotated Image
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Select a result to view detailed analysis</p>
              </div>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {isLoading && (
          <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>YOLOv10 processing images...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionPage;