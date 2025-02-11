import React, { useState, useEffect } from "react";

const Links = ({
  folderLink,
  setFolderLink,
  handleShowFiles,
  activeScreen,
  savedFolderLink,
  setSavedFolderLink,
}) => {
  const [folderLinks, setFolderLinks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch folder links when the component loads
  useEffect(() => {
    const fetchFolderLinks = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user/folder-links", {
          credentials: "include", // Ensure cookies/session are sent
        });

        if (!response.ok) {
          throw new Error("Failed to fetch folder links");
        }

        const data = await response.json();
        setFolderLinks(data.folderLinks);
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(`Error fetching folder links: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFolderLinks();
  }, []);

  // On mount, check local storage for a saved folder link and update state
  useEffect(() => {
    const storedLink = localStorage.getItem("savedFolderLink");
    if (storedLink) {
      setSavedFolderLink(storedLink);
    }
  }, [setSavedFolderLink]);

  // Update local storage whenever savedFolderLink changes
  useEffect(() => {
    if (savedFolderLink) {
      localStorage.setItem("savedFolderLink", savedFolderLink);
    } else {
      localStorage.removeItem("savedFolderLink");
    }
  }, [savedFolderLink]);

  // When activeScreen is 2, use the stored savedFolderLink (from state or local storage)
  useEffect(() => {
    if (activeScreen === 2) {
      // Use the savedFolderLink prop if available; otherwise check localStorage
      const storedLink = savedFolderLink || localStorage.getItem("savedFolderLink");
      if (storedLink) {
        setFolderLink(storedLink);
        handleShowFiles(storedLink);
        // If savedFolderLink was empty, update it with the stored value.
        if (!savedFolderLink) {
          setSavedFolderLink(storedLink);
        }
      }
    }
  }, [activeScreen, savedFolderLink]);

  // Whenever folderLink is changed via the dropdown (i.e. it's one of the preset folderLinks),
  // update the savedFolderLink (and therefore local storage) accordingly.
  useEffect(() => {
    if (folderLink && folderLinks.includes(folderLink)) {
      setSavedFolderLink(folderLink);
    }
  }, [folderLink, folderLinks, setSavedFolderLink]);

  // Handle input change for folder link
  const handleFolderLinkChange = async (e) => {
    setFolderLink(e.target.value);
    await handleShowFiles(e.target.value);
  };

  // Save or delete folder link based on its existence in folderLinks
  const handleFolderLinkAction = async () => {
    if (folderLink.trim() === "") return;

    if (folderLinks.includes(folderLink)) {
      // If the folder link exists, delete it
      deleteFolderLink(folderLink);
    } else {
      // If the folder link does not exist, save it
      saveFolderLink(folderLink);
    }
  };

  // Save folder link logic
  const saveFolderLink = async (folderLink) => {
    try {
      const response = await fetch("http://localhost:5000/api/user/save-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderLink }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data.message);
        alert("Folder saved successfully!");
        setFolderLinks((prevLinks) => [...prevLinks, folderLink]);
        setFolderLink(""); // Clear input field
      } else {
        console.error(data.message);
        alert(data.message || "Failed to save folder.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while saving the folder.");
    }
  };

  // Delete folder link logic
  const deleteFolderLink = async (folderLink) => {
    try {
      const response = await fetch("http://localhost:5000/api/user/delete-folder", {
        method: "POST", // Use POST for deleting as well
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderLink }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data.message);
        alert("Folder deleted successfully!");
        setFolderLinks((prevLinks) => prevLinks.filter((link) => link !== folderLink));
        setFolderLink(""); // Clear input field

        // If the deleted folder is the saved one, clear it from state and local storage
        if (savedFolderLink === folderLink) {
          setSavedFolderLink(null);
          localStorage.removeItem("savedFolderLink");
        }
      } else {
        console.error(data.message);
        alert(data.message || "Failed to delete folder.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while deleting the folder.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <div>
          {/* Add/Remove Folder Section */}
          <div style={{ marginBottom: "20px" }}>
            <select
              id="folderLink"
              value={folderLinks.includes(folderLink) ? folderLink : ""}
              onChange={handleFolderLinkChange}
              style={{
                width: "300px",
                padding: "8px",
                margin: "10px 0",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="">Select a folder or type your own</option>
              {folderLinks.map((link, index) => (
                <option key={index} value={link}>
                  {link}
                </option>
              ))}
            </select>

            {/* Custom input field to type a new folder link */}
            {!folderLinks.includes(folderLink) && (
              <div style={{ marginTop: "10px" }}>
                <input
                  type="text"
                  id="folderLinkInput"
                  value={folderLink}
                  onChange={handleFolderLinkChange}
                  placeholder="Enter folder link"
                  style={{
                    width: "300px",
                    padding: "8px",
                    margin: "10px 0",
                    fontSize: "14px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleFolderLinkAction}
              style={{
                padding: "8px 16px",
                backgroundColor: folderLinks.includes(folderLink) ? "#f44336" : "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {folderLinks.includes(folderLink) ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
</svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy" viewBox="0 0 16 16">
  <path d="M11 2H9v3h2z"/>
  <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z"/>
</svg>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Links;
