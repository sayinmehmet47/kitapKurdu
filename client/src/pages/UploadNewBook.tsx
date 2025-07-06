import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Book,
} from 'lucide-react';
import { toast } from 'sonner';

import Layout from '../components/Layout';
import { useAppSelector } from '@/redux/store';
import { useAddNewBookMutation } from '../redux/services/book.api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Progress,
  Badge,
  Alert,
  AlertDescription,
} from '@/components/ui';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function UploadNewBook() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [addNewBook] = useAddNewBookMutation();
  const user = useAppSelector((state) => state.authSlice.user.user);
  const userId = user.id || user.username;

  const uploadToCloudinary = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'unsigned_upload'); // You may need to configure this

    const response = await fetch(
      process.env.REACT_APP_CLOUDINARY_URL as string,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  };

  const addBook = async (response: any, originalFile: File) => {
    const book = {
      name: originalFile.name,
      size: response.bytes,
      url: response.secure_url,
      uploader: userId,
    };

    await addNewBook(book).unwrap();
    return book;
  };

  const handleFileUpload = async (fileItem: UploadFile) => {
    try {
      // Update status to uploading
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      // Simulate progress (you can implement real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      // Upload to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(fileItem.file);

      // Add to database
      const book = await addBook(cloudinaryResponse, fileItem.file);

      clearInterval(progressInterval);

      // Update status to success
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: 'success', progress: 100 } : f
        )
      );

      toast.success(`${book.name} has been uploaded successfully!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';

      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      toast.error(`Upload failed: ${errorMessage}`);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = () => {
    uploadFiles.filter((f) => f.status === 'pending').forEach(handleFileUpload);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
    },
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return (
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const pendingFiles = uploadFiles.filter((f) => f.status === 'pending');
  const completedFiles = uploadFiles.filter((f) => f.status === 'success');

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950/30 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="bg-primary/10 p-3 rounded-xl mr-4">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Upload Books
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Share your favorite books with the community
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Upload PDF and EPUB files to expand our digital library
            </p>
          </div>

          {/* Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Select Files
              </CardTitle>
              <CardDescription>
                Drag and drop your books here, or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                  ${
                    isDragActive
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  {isDragActive ? (
                    <p className="text-lg font-medium text-primary">
                      Drop your books here!
                    </p>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Choose files or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        PDF and EPUB files up to 100MB each
                      </p>
                    </>
                  )}
                  <Button variant="outline" type="button">
                    Browse Files
                  </Button>
                </div>
              </div>

              {/* File Type Info */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>PDF files:</strong> Perfect for academic papers,
                    textbooks, and documents
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Book className="h-4 w-4" />
                  <AlertDescription>
                    <strong>EPUB files:</strong> Ideal for novels, stories, and
                    reflowable content
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upload Queue</CardTitle>
                  <CardDescription>
                    {completedFiles.length} of {uploadFiles.length} files
                    uploaded
                  </CardDescription>
                </div>
                {pendingFiles.length > 0 && (
                  <Button onClick={uploadAll} className="ml-4">
                    Upload All ({pendingFiles.length})
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadFiles.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {getStatusIcon(fileItem.status)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {fileItem.file.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {formatFileSize(fileItem.file.size)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {fileItem.file.name
                                .split('.')
                                .pop()
                                ?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {fileItem.status === 'uploading' && (
                          <div className="space-y-2">
                            <Progress
                              value={fileItem.progress}
                              className="h-2"
                            />
                            <p className="text-xs text-gray-500">
                              Uploading... {fileItem.progress}%
                            </p>
                          </div>
                        )}

                        {fileItem.status === 'error' && (
                          <p className="text-xs text-red-500">
                            Error: {fileItem.error}
                          </p>
                        )}

                        {fileItem.status === 'success' && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Upload completed successfully!
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {fileItem.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileItem.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {fileItem.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileUpload(fileItem)}
                            className="ml-2"
                          >
                            Upload
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
