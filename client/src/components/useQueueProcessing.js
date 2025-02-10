import { useState, useEffect } from "react";
import axios from "axios";

const useQueueProcessing = () => {
  const [queue, setQueue] = useState([]); // Queue for files to process
  const [isProcessing, setProcessing] = useState(false); // Processing state
  const [queueStatus, setQueueStatus] = useState(""); // To display the queue status

  // Function to push files to the queue
  const pushToQueue = (file) => {
    setProcessing(true);
    setQueue((prevQueue) => [...prevQueue, file]);
  };

  // Function to process files in the queue
  const processQueue = async () => {
 // Prevent multiple simultaneous processes
 // Set processing state to true

    while (queue.length > 0) {
      const file = queue.shift(); // Get the next file from the queue
      try {
        const response = await axios.get("http://localhost:5000/api/pdf/process-pdf", {
          params: { fileId: file.id, filename: file.name },
          withCredentials: true,
        });
        console.log(`Extracted text for file ${file.name}:`, response.data.text);
      } catch (err) {
        console.error(`Error processing PDF for file ${file.name}:`, err);
      }
    }

    setProcessing(false); // Set processing state to false once done
    setQueueStatus("All files processed.");
  };

  // Effect to monitor queue changes and process it
  useEffect(() => {
    if (queue.length > 0) {
      setQueueStatus(`Processing ${queue.length} file(s)...`);
      setProcessing(true);
      processQueue();
    } else {
      setQueueStatus("No files in queue");setProcessing(false);
    }
  }, [queue]); // Runs the effect whenever the queue changes

  return { pushToQueue, isProcessing, queueStatus };
};

export default useQueueProcessing;
