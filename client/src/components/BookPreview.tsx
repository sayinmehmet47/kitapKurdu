import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { ReactReader } from 'react-reader';

interface BookPreviewProps {
  bookUrl: string;
  fileType: string;
}

export const BookPreview = ({ bookUrl, fileType }: BookPreviewProps) => {
  const [location, setLocation] = useState<string | number>(0);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  if (fileType === 'pdf') {
    return (
      <div>
        <Document file={bookUrl} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} className="h-full" />
          <p>
            Page {pageNumber} of {numPages}
          </p>
        </Document>
      </div>
    );
  } else if (fileType === 'epub') {
    return (
      <div style={{ height: '90vh', marginTop: '20px' }}>
        <ReactReader
          url={bookUrl}
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
        />
      </div>
    );
  }
};
