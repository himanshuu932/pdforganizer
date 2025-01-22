import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PyPDF2 import PdfReader
import logging
from pdf2image import convert_from_path
import pytesseract

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Path to Tesseract executable
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Update path as needed

# Flask App Setup
app = Flask(__name__)  # Corrected _name_ to __name__

# Enable CORS for all routes
CORS(app)

# Configure the GenAI API
genai.configure(api_key="AIzaSyBZM6dTMcLhZ-nY7Uetow2JbxTsAP4lqxg")

# Function to extract text from PDF (including OCR)
def extract_text_from_pdf(pdf_path):
    text = ""
    reader = PdfReader(pdf_path)
    
    # Extract text from the textual content of the PDF
    for page in reader.pages:
        text += page.extract_text()

    # Extract text from images within the PDF using OCR
    images = convert_from_path(pdf_path, dpi=300, poppler_path=r"C:\Program Files\poppler-24.08.0\Library\bin")  # Specify Poppler path if needed
    for i, image in enumerate(images):
        temp_image_path = f"temp_page_{i}.png"
        image.save(temp_image_path, "PNG")
        text += "\n" + pytesseract.image_to_string(temp_image_path)  # OCR to extract text from image
        os.remove(temp_image_path)  # Clean up the temporary image file

    return text

# Function to download PDF from a URL
def download_pdf(pdf_url):
    response = requests.get(pdf_url)
    if response.status_code == 200:
        filename = pdf_url.split("/")[-1]  # Extract filename from URL
        with open(filename, "wb") as f:
            f.write(response.content)
        return filename
    else:
        raise Exception(f"Failed to download PDF. Status code: {response.status_code}")

# Route to extract text from PDF
# Route to extract text from PDF
@app.route('/extract', methods=['POST'])
def extract_text():
    try:
        # Get the JSON data from the request
        data = request.get_json()
        pdf_path = data.get('file_path')

        if not pdf_path:
            return jsonify({"error": "'file_path' is required."}), 400

        # Check if the file path is a URL or local file path
        if pdf_path.startswith("http://") or pdf_path.startswith("https://"):
            # If the path is a URL, download the PDF
            pdf_path = download_pdf(pdf_path)
        
        raw_text = f'filename-{pdf_path}'
        raw_text += '\\n'
        # Extract text from the uploaded or downloaded PDF
        extracted_text = extract_text_from_pdf(pdf_path)
        
        if extracted_text:
            raw_text += extracted_text.replace('\n', '\\n') + '\n'
        
        # Return the extracted text
        return jsonify({"text": raw_text})

    except Exception as e:
        logging.error(f"Error extracting text from PDF: {e}")
        return jsonify({"error": str(e)}), 500

# Route to query text with GenAI
@app.route('/pdf-query', methods=['POST'])
def pdf_query():
    try:
        # Get the JSON data from the request
        data = request.get_json()
        texts = data.get('texts', [])
        user_query = data.get('query')

        if not texts or not user_query:
            return jsonify({"error": "Both 'texts' and 'query' are required."}), 400

        # Configure the generation settings
        generation_config = {
            "temperature": 2,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }

        # Create the model
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config=generation_config,
        )

        # Add texts and query to chat history
        chat_history = [
            { 
                "role": "user", 
                "parts": texts 
            },
            { 
                "role": "user", 
                "parts": [user_query] 
            },
            { 
                "role": "model", 
                "parts": [
                    'also use only single * for bold', 
                ]
            },
           
  {
    "role": "model",
    "parts": [
      "example how to send a table",
      "make sure to add gap in between for those columns which does not have data in last row for some but has for others. For example, if 'total' is in the last column, then keep previous columns empty",
      "table-starts\nBasic Sciences & Maths (BSM)|4\nEngineering Fundamentals (EF)|4\nProfessional Skill (PS)|0\nProgram Core (PC)|10\nManagement (M)|0\nHumanities & Social Science (HSS)|2\nHumanities & Social Science Elective|0\nProject (P)|0\nSeminar (S)|0\nIndustrial Practice (IP) / Industrial Elective (IE)|0/0\nProgram link basic science and engineering courses|2\nProgram Electives (PE)|0\nOpen Electives (OE)|0\nTotal|||22 table-ends"
    ]
  },
  {
    "role": "model",
    "parts": [
      "while replying for a query related to table always send table data enclosed between table-starts and table-ends"
    ]
  },
  {
    "role": "model",
    "parts": [
      "when replying to general conversation talk normally"
    ]
  },
  {
    "role": "model",
    "parts": [
      "when asked who are you? You are peep. An assistant developed by team Bludgers for queries of pdf. Don’t include sources-<filename>"
    ]
  },
  {
    "role": "model",
    "parts": [
      "Always append filename/s in the answer related to information in the last as '/ltkgya-sources' then followed by the filename or filenames if multiple separated by a comma, don’t use * after sources the file name is one that is of extension .pdf don’t include the text filename-uploads/"
    ]
  },
  {
    "role": "model",
    "parts": [
      "if possible try to send the information available in the form of table and texts both as it will properly describe and is visually appealing"
    ]
  },
  {
    "role": "model",
    "parts": [
      "if a document contains a multi-step process or instruction, break the response into bullet points or numbered steps for better clarity"
    ]
  },
  {
    "role": "model",
    "parts": [
      "for complex information, ensure to provide a concise summary first and then follow up with more detailed explanations or sections"
    ]
  },
  {
    "role": "model",
    "parts": [
      "in case of discrepancies between values in the same column, highlight the inconsistency with a note (e.g., 'check discrepancy between values')"
    ]
  },
  {
    "role": "model",
    "parts": [
      "if the query contains any multi-choice or select options, format the options in a bullet-point list for clarity"
    ]
  },
  {
    "role": "model",
    "parts": [
      "if the user query is about missing data or empty fields, indicate that as 'data unavailable' and make sure the response clearly states the absence"
    ]
  },
  {
    "role": "model",
    "parts": [
      "in case of any external links or resources, ensure to mark them clearly as references and ensure the user knows where to find them"
    ]
  },
  {
    "role": "model",
    "parts": [
      "for scientific, engineering, or technical content, use appropriate units of measurement and scientific notations where necessary"
    ]
  },
  {
    "role": "model",
    "parts": [
      "for PDF extraction queries, mention the method used (text extraction or OCR) and provide an appropriate message in case OCR wasn't successful"
    ]
  }
]


        # Start the chat session
        chat_session = model.start_chat(history=chat_history)

        # Get the response from the chat model
        response = chat_session.send_message(user_query)

        # Return the response
        return jsonify({"answer": response.text})

    except Exception as e:
        logging.error(f"Error querying text: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':  # Corrected _name_ to __name__
    app.run(debug=False)
