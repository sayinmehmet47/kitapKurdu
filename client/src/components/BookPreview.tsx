import { ArrowLeftIcon } from 'lucide-react';
import { useState } from 'react';
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

  if (fileType === 'pdf') {
    return (
      <>
        <ArrowLeftIcon
          size={32}
          className="cursor-pointer border border-gray-400 rounded-full hover:bg-gray-200 hover:shadow-md relative left-2 my-2"
          onClick={() => navigate(-1)}
        />
        <embed
          src={bookUrl}
          type="application/pdf"
          className="w-full h-[calc(100vh-44px)]"
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
