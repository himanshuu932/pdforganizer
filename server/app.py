import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PyPDF2 import PdfReader
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Flask App Setup
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Configure the GenAI API
genai.configure(api_key="AIzaSyBZM6dTMcLhZ-nY7Uetow2JbxTsAP4lqxg")

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
        
        # Read the PDF file
        pdf_reader = PdfReader(pdf_path)
        raw_text = f'filename-{pdf_path}'
        raw_text+='\\n'
        for page in pdf_reader.pages:
            content = page.extract_text()
            if content:
                raw_text += content.replace('\n', '\\n') + '\\n'
        
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
            {"role": "user", "parts": texts},
            {"role": "user", "parts": [user_query]}
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

if __name__ == '__main__':
    app.run(debug=False)
