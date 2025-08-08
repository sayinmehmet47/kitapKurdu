import { toast } from 'sonner';

interface ShareLinkParams {
  title: string;
  text?: string;
  url: string;
}

export const shareLink = async ({ title, text, url }: ShareLinkParams) => {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  } catch (error) {
    // User may cancel share; ignore silently
  }
};
