import React, { useEffect, useState } from "react";
import { base } from "./api/api";

const App = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const serverMessage = await base(); // Fetch the message from the server
      setMessage(serverMessage); // Update state with the server message
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>React and Node.js</h1>
      <p>Message from server: {message}</p>
    </div>
  );
};

export default App;
