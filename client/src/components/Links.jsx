import React, { useState, useEffect } from "react";
import "./styles/Links.css"; // Import the CSS file

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

  // State for the add-folder modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderLink, setNewFolderLink] = useState("");
 const [token, setToken] = useState(localStorage.getItem("token"));
  // State for the delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch folder links from the database on component mount
  useEffect(() => {
    setToken(localStorage.getItem("token"));
    const fetchFolderLinks = async () => {
      try {
        
        const response = await fetch("https://pdforganizer-vt1s.onrender.com/api/user/folder-links", {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
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
      const storedLink = savedFolderLink || localStorage.getItem("savedFolderLink");
      if (storedLink) {
        setFolderLink(storedLink);
        handleShowFiles(storedLink);
        if (!savedFolderLink) {
          setSavedFolderLink(storedLink);
        }
      }
    }
  }, [activeScreen, savedFolderLink]);

  // When a folder is selected from the dropdown, update savedFolderLink accordingly
  useEffect(() => {
    if (folderLink && folderLinks.includes(folderLink)) {
      setSavedFolderLink(folderLink);
    }
  }, [folderLink, folderLinks, setSavedFolderLink]);

  // Handle changes when selecting a folder from the dropdown
  const handleFolderLinkChange = async (e) => {
    const selectedLink = e.target.value;
    setFolderLink(selectedLink);
    await handleShowFiles(selectedLink);
  };

  // Save a new folder link via the API
  const saveFolderLink = async (link) => {
    try {
      const response = await fetch("https://pdforganizer-vt1s.onrender.com/api/user/save-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ folderLink: link }),
       
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data.message);
        alert("Folder saved successfully!");
        setFolderLinks((prevLinks) => [...prevLinks, link]);
        setFolderLink(link);
        handleShowFiles(link);
      } else {
        console.error(data.message);
        alert(data.message || "Failed to save folder.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while saving the folder.");
    }
  };

  // Delete the selected folder link via the API
  const deleteFolderLink = async (link) => {
    try {
      const response = await fetch("https://pdforganizer-vt1s.onrender.com/api/user/delete-folder", {
        method: "POST", // Using POST for deletion
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ folderLink: link }),
        
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data.message);
        alert("Folder deleted successfully!");
        setFolderLinks((prevLinks) => prevLinks.filter((l) => l !== link));
        if (savedFolderLink === link) {
          setSavedFolderLink(null);
          localStorage.removeItem("savedFolderLink");
        }
        if (folderLink === link) {
          setFolderLink("");
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

  // Handler for saving a new folder link from the modal
  const handleSaveFolderLink = async () => {
    if (newFolderLink.trim() === "") return;
    await saveFolderLink(newFolderLink);
    setNewFolderLink("");
    setIsModalOpen(false);
  };

  return (
    <div className="links-wrapper-links">
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <div>
          {/* Container for the dropdown and buttons */}
          <div className="links-container-links">
            <select
              id="folderLink"
              value={folderLinks.includes(folderLink) ? folderLink : ""}
              onChange={handleFolderLinkChange}
              className="folder-select-links"
            >
              <option value="">Select a folder</option>
              {folderLinks.map((link, index) => (
                <option key={index} value={link}>
                  {link}
                </option>
              ))}
              {folderLinks.length === 0 && (
                <option value="">No Links, please add a drive link</option>
              )}
            </select>
            <div className="cc">
            <button onClick={() => setIsModalOpen(true)} className="button-links add-button-links">
              {/* Plus Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-cloud-plus-fill"
                viewBox="0 0 16 16"
              >
                <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m.5 4v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 1 0"/>
              </svg>
            </button>
            {folderLinks.length > 0 && (
              <button
                onClick={() => {
                  if (folderLink) {
                    setIsDeleteModalOpen(true);
                  }
                }}
                className="button-links delete-button-links"
                disabled={!folderLink || !folderLinks.includes(folderLink)}
                title={!folderLink ? "No folder selected" : "Delete selected folder"}
              >
                {/* Trash Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-trash3"
                  viewBox="0 0 16 16"
                  style={{ marginRight: "5px" }}
                >
                  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                </svg>
              </button>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding a new folder link */}
      {isModalOpen && (
        <div className="modal-overlay-links">
          <div className="modal-links">
            <h2 className="modal-header-links">Add Folder Link</h2>
            <input
              type="text"
              value={newFolderLink}
              onChange={(e) => setNewFolderLink(e.target.value)}
              placeholder="Enter folder link"
              className="modal-input-links"
            />
            <div className="modal-buttons-links">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewFolderLink("");
                }}
                className="button-links cancel-button-links"
              >
                Cancel
              </button>
              <button onClick={handleSaveFolderLink} className="button-links add-button-links">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal for deleting a folder link */}
      {isDeleteModalOpen && (
        <div className="modal-overlay-links">
          <div className="modal-links">
            <h2 className="modal-header-links">Confirm Delete</h2>
            <p>Are you sure you want to delete the selected folder?</p>
            <div className="modal-buttons-links">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="button-links cancel-button-alt-links"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteFolderLink(folderLink);
                  setIsDeleteModalOpen(false);
                }}
                className="button-links delete-button-links"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Links;
