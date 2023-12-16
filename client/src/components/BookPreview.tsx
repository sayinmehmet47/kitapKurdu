import { ArrowLeftIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import DocViewer, {
  DocViewerRenderers,
  PDFRenderer,
  PNGRenderer,
} from '@cyntler/react-doc-viewer';
import { ReactReader } from 'react-reader';
import { useNavigate } from 'react-router-dom';

interface BookPreviewProps {
  bookUrl: string;
  fileType: string;
  bookName: string;
}

export const BookPreview = ({
  bookUrl,
  fileType,
  bookName,
}: BookPreviewProps) => {
  const [location, setLocation] = useState<string | number>(0);
  const navigate = useNavigate();

  const docs = [
    {
      uri: bookUrl,
    },
  ];

  if (fileType === 'pdf') {
    return (
      <>
        <ArrowLeftIcon
          size={32}
          className="cursor-pointer border border-gray-400 rounded-full hover:bg-gray-200 hover:shadow-md relative left-2 my-2"
          onClick={() => navigate(-1)}
        />
        <DocViewer
          documents={docs}
          initialActiveDocument={docs[1]}
          config={{
            pdfVerticalScrollByDefault: true,
          }}
        />
      </>
    );
  } else if (fileType === 'epub') {
    return (
      <div className="h-screen">
        <ArrowLeftIcon
          size={32}
          className="cursor-pointer border border-gray-400 rounded-full hover:bg-gray-200 hover:shadow-md relative left-2  my-2"
          onClick={() => navigate(-1)}
        />
        <ReactReader
          url={bookUrl}
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
          title={bookName}
          showToc={true}
        />
      </div>
    );
  }
};
