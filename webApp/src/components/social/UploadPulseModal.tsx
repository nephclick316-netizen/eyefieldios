import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Image as ImageIcon, X, Camera, Video, Sparkles, Link as LinkIcon, Type } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import MediaStudio from "../media/MediaStudio";
import { uploadMedia } from "@/utils/upload";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const UploadPulseModal: React.FC<{ trigger?: React.ReactNode }> = ({ trigger }) => {
  const [file, setFile] = useState<{ url: string, type: 'image' | 'video', blob?: Blob } | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setRawFiles([e.target.files[0]]);
      setIsStudioOpen(true);
    }
  };

  const handleStudioComplete = (results: { blob: Blob; type: "image" | "video" }[]) => {
    if (results.length > 0) {
      setFile({
        url: URL.createObjectURL(results[0].blob),
        type: results[0].type,
        blob: results[0].blob
      });
    }
  };

  const { user } = useUser();
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!user) {
      toast.error("You must be logged in to post.");
      return;
    }
    if (!file || !file.blob) {
      toast.error("Please select a media file.");
      return;
    }

    setIsPosting(true);
    try {
      const uploadedUrl = await uploadMedia(file.blob, 'pulses', user.id);
      
      const { error } = await supabase
        .from('pulses')
        .insert({
          user_id: user.id,
          media_type: file.type,
          media_url: uploadedUrl,
          caption: caption,
          link_url: linkUrl
        });

      if (error) throw error;

      showSuccess("Pulse shared successfully!");
      setFile(null);
      setCaption("");
      setLinkUrl("");
      window.location.reload();
    } catch (error) {
      console.error("Error posting pulse:", error);
      toast.error("Failed to share Pulse. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <button className="w-20 h-28 rounded-[14px] border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shrink-0">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Plus size={20} />
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase">Add Pulse</span>
            </button>
          )}
        </DialogTrigger>
        <DialogContent className="bg-background border-white/10 rounded-[2.5rem] max-w-sm p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-accent">Share a Pulse</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {!file ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <Camera size={32} className="text-muted-foreground group-hover:text-accent transition-colors mb-2" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Photo</span>
                  <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                </label>
                <label className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <Video size={32} className="text-muted-foreground group-hover:text-accent transition-colors mb-2" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Video</span>
                  <input type="file" className="hidden" onChange={handleUpload} accept="video/*" />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-[9/16] max-h-[40vh] mx-auto rounded-3xl overflow-hidden border border-white/5 bg-black shadow-2xl shadow-accent/10">
                  {file.type === 'image' ? (
                    <img src={file.url} className="w-full h-full object-cover" />
                  ) : (
                    <video src={file.url} className="w-full h-full object-cover" controls />
                  )}
                  
                  <button 
                    onClick={() => setFile(null)}
                    className="absolute top-3 right-3 bg-black/50 rounded-xl p-2 text-white hover:bg-red-500 transition-all z-10 backdrop-blur-md"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Type className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <Textarea 
                      placeholder="Add a caption..." 
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="pl-10 rounded-2xl bg-muted/50 border-none resize-none h-20"
                    />
                  </div>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      placeholder="Add a link (optional)" 
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="pl-10 rounded-2xl bg-muted/50 border-none h-12"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handlePost}
              disabled={isPosting || !file}
              className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20 transition-all active:scale-[0.98]"
            >
              {isPosting ? "Sharing..." : "Post Pulse"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaStudio 
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        files={rawFiles}
        onComplete={handleStudioComplete}
        maxImages={1}
        aspectRatio={9/16}
      />
    </>
  );
};

export default UploadPulseModal;