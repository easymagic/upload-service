## Usage

1. Start the server:

The server will start on port 3000 (or PORT environment variable if set).

### Uploading Files

Send a POST request to `/upload` with a file in the 'file' field:

### Downloading Files

Use the GET `/download` endpoint with the file path:



## API Endpoints

### POST /upload
- Accepts multipart form data with a file field named 'file'
- Supports video (.mp4, .mov, .avi) and image (.jpg, .jpeg, .png) files
- Returns JSON with processed file paths and status

### GET /download
- Accepts a query parameter 'path' pointing to the file location
- Returns the requested file if found

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
