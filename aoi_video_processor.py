import cv2
import numpy as np
import os
from ultralytics import YOLO

# --- Configuration ---
# NOTE: Replace 'input_pcb_sim.mp4' with the path to your actual video file.
# You will need to create a video from your sample PCB images to test this.
VIDEO_PATH = 'input_pcb_sim.mp4'
# The trained model file you already have.
MODEL_PATH = 'best.pt'
# Output video file name
OUTPUT_VIDEO_PATH = 'aoi_inspection_output.mp4'

# --- Setup and Initialization ---
def run_automated_inspection():
    """
    Initializes the model and video streams to run automated defect inspection
    on an input video file, simulating a continuous AOI line.
    """
    print("--- Starting Automated AOI Inspection Simulation ---")
    print(f"Loading Model: {MODEL_PATH}")

    # 1. Load the trained model
    try:
        # The YOLO model structure handles the weights file automatically
        model = YOLO(MODEL_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model {MODEL_PATH}: {e}")
        print("Please ensure you have the 'ultralytics' library installed (`pip install ultralytics`) and 'best.pt' is in the current directory.")
        return

    # 2. Open the input video stream
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print(f"Error: Could not open video file at {VIDEO_PATH}")
        print("Please check the path and ensure the video codec is supported.")
        return

    # 3. Define output video parameters
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    # Use MP4V codec for MP4 compatibility (FourCC code for video compression)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v') 
    out = cv2.VideoWriter(OUTPUT_VIDEO_PATH, fourcc, fps, (frame_width, frame_height))

    print(f"Input Video Details: {frame_width}x{frame_height} @ {fps:.2f} FPS")
    print(f"Output will be saved to: {OUTPUT_VIDEO_PATH}")

    frame_count = 0
    
    # 4. Main Processing Loop (Simulating the conveyor belt)
    while cap.isOpened():
        # Read the current frame
        ret, frame = cap.read()

        # If 'ret' is False, the video has ended or there was an error reading the frame
        if not ret:
            break

        frame_count += 1

        try:
            # 5. Run Model Inference (The AI Inspection Step)
            # stream=True processes results efficiently for real-time applications
            # We are using the internal 'predict' method of the YOLO model
            results = model.predict(source=frame, save=False, conf=0.25)
            
            # Get the first result object (assuming one frame per inference call)
            result = results[0]
            
            # 6. Annotate the frame
            # The .plot() method automatically draws bounding boxes/masks and labels
            # onto the frame, making the visualization step easy.
            annotated_frame = result.plot()
            
            # Optional: Add a simple status text for the demo
            defect_count = len(result.boxes) if result.boxes is not None else 0
            status_text = f"Frame: {frame_count} | Defects Found: {defect_count}"
            
            cv2.putText(annotated_frame, status_text, (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)


            # 7. Display the live feed (for demo purposes)
            cv2.imshow('Automated AOI Inspection Simulation', annotated_frame)

            # 8. Write the annotated frame to the output video
            out.write(annotated_frame)

        except Exception as e:
            print(f"An error occurred during inference on frame {frame_count}: {e}")
            break

        # Press 'q' to break the loop and stop the simulation
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("\nUser quit simulation.")
            break

    # 9. Cleanup and Release Resources
    cap.release()
    out.release()
    cv2.destroyAllWindows()
    print("\n--- Simulation Complete ---")
    print(f"Processed {frame_count} frames. Results saved to {OUTPUT_VIDEO_PATH}")


if __name__ == '__main__':
    run_automated_inspection()
