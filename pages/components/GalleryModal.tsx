
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, Info, Image as ImageIcon, Download, CheckSquare, Square, ChevronLeft, ChevronRight, Loader, Trash2, AlertCircle, Layers, Server } from 'lucide-react';
import { Event, ImageSubmission } from '../../types';
import { getPresignedUrl } from '../../services/wasabi';

interface GalleryModalProps {
  event: Event;
  onClose: () => void;
  onViewDetails?: () => void;
  onPhotographerClick?: (id: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  isOwner?: boolean;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ event, onClose, onViewDetails, onPhotographerClick, onDeletePhoto, isOwner }) => {
  const [galleryFilter, setGalleryFilter] = useState<'OFFICIAL' | 'OPEN_SHOOT'>('OFFICIAL');
  const [previewImage, setPreviewImage] = useState<ImageSubmission | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zipFailed, setZipFailed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [presignedUrls, setPresignedUrls] = useState<Record<string, string>>({});

  const currentFilteredSubmissions = useMemo(() => {
    if (!event || !event.submissions) return [];
    return event.submissions.filter(s => s.type === galleryFilter);
  }, [event, galleryFilter]);

  // ON-DEMAND PRESIGNING: Only fetch usable URLs for the current view
  useEffect(() => {
    const fetchUrls = async () => {
      const newUrls: Record<string, string> = { ...presignedUrls };
      let changed = false;
      
      for (const sub of currentFilteredSubmissions) {
        if (!newUrls[sub.id]) {
          try {
            const url = await getPresignedUrl(sub.object_key || sub.url);
            newUrls[sub.id] = url;
            changed = true;
          } catch (e) {
            newUrls[sub.id] = sub.url; // fallback
          }
        }
      }
      if (changed) setPresignedUrls(newUrls);
    };
    fetchUrls();
  }, [currentFilteredSubmissions]);

  const resetSelection = () => {
    setSelectedImageIds(new Set());
    setLastSelectedIndex(null);
    setZipFailed(false);
  };

  const handleNextImage = useCallback(() => {
    if (!previewImage) return;
    const currentIndex = currentFilteredSubmissions.findIndex(s => s.id === previewImage.id);
    if (currentIndex !== -1 && currentIndex < currentFilteredSubmissions.length - 1) {
      setPreviewImage(currentFilteredSubmissions[currentIndex + 1]);
    }
  }, [previewImage, currentFilteredSubmissions]);

  const handlePrevImage = useCallback(() => {
    if (!previewImage) return;
    const currentIndex = currentFilteredSubmissions.findIndex(s => s.id === previewImage.id);
    if (currentIndex > 0) {
      setPreviewImage(currentFilteredSubmissions[currentIndex - 1]);
    }
  }, [previewImage, currentFilteredSubmissions]);

  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, handleNextImage, handlePrevImage]);

  const handleSelectImage = (id: string, index: number, shiftKey: boolean) => {
    const newSelection = new Set(selectedImageIds);
    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      currentFilteredSubmissions.slice(start, end + 1).forEach(s => newSelection.add(s.id));
    } else {
      if (newSelection.has(id)) newSelection.delete(id);
      else newSelection.add(id);
      setLastSelectedIndex(index);
    }
    setSelectedImageIds(newSelection);
    setZipFailed(false);
  };

  const handleSelectAll = () => {
    setSelectedImageIds(new Set(currentFilteredSubmissions.map(s => s.id)));
    setZipFailed(false);
  };

  const handleDeselectAll = () => {
    setSelectedImageIds(new Set());
    setLastSelectedIndex(null);
    setZipFailed(false);
  };

  const downloadSingleImage = async (img: ImageSubmission) => {
    try {
        const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `kyroma-${safeTitle}-${img.id}.jpg`;
        const downloadUrl = await getPresignedUrl(img.object_key || img.url, 60, filename);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Single download failed", error);
        window.open(presignedUrls[img.id] || img.url, '_blank');
    }
  };

  const handleSequentialDownload = async () => {
    const imagesToDownload = currentFilteredSubmissions.filter(s => selectedImageIds.has(s.id));
    if (imagesToDownload.length === 0) return;
    setIsDownloading(true);
    for (let i = 0; i < imagesToDownload.length; i++) {
        await downloadSingleImage(imagesToDownload[i]);
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    setIsDownloading(false);
  };

  const renderImagePreview = () => {
    if (!previewImage) return null;
    const isSelected = selectedImageIds.has(previewImage.id);
    const index = currentFilteredSubmissions.findIndex(s => s.id === previewImage.id);
    const currentUrl = presignedUrls[previewImage.id] || previewImage.url;
    
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in-up" onClick={() => setPreviewImage(null)}>
        <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-[70] bg-black/50 rounded-full" onClick={() => setPreviewImage(null)}><X className="w-6 h-6" /></button>
        
        {index > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 bg-black/50 hover:bg-opacity-70 rounded-full z-[70] transition-all hover:scale-110" onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}><ChevronLeft className="w-8 h-8" /></button>
        )}
        {index < currentFilteredSubmissions.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 bg-black/50 hover:bg-opacity-70 rounded-full z-[70] transition-all hover:scale-110" onClick={(e) => { e.stopPropagation(); handleNextImage(); }}><ChevronRight className="w-8 h-8" /></button>
        )}
        
        <div className="max-w-6xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={currentUrl} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-black" />
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between w-full max-w-3xl text-white bg-gray-900/80 p-4 rounded-xl border border-gray-700 backdrop-blur-md shadow-lg">
                <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                    <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center font-bold">{(previewImage.photographerName || 'P').charAt(0)}</div>
                    <div>
                        <p className="font-bold text-sm sm:text-base cursor-pointer hover:underline" onClick={() => { if(onPhotographerClick) { setPreviewImage(null); onClose(); onPhotographerClick(previewImage.photographerId); } }}>{previewImage.photographerName}</p>
                        <p className="text-xs text-gray-400">{new Date(previewImage.submittedAt).toLocaleDateString()} • {previewImage.type}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {isOwner && <button onClick={() => setConfirmDelete(previewImage.id)} className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg font-medium transition-all border border-red-600/50"><Trash2 className="w-4 h-4 mr-2" />Delete</button>}
                    <button onClick={() => handleSelectImage(previewImage.id, index, false)} className={`flex items-center px-4 py-2.5 rounded-lg border transition-all ${isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'bg-transparent border-gray-500 text-gray-300 hover:border-gray-300'}`}>{isSelected ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}{isSelected ? 'Selected' : 'Select'}</button>
                    <button onClick={() => downloadSingleImage(previewImage)} className="flex items-center px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all shadow-lg active:scale-95"><Download className="w-4 h-4 mr-2" />Download</button>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
           <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
             <div>
               <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
               <div className="flex items-center space-x-3 text-sm mt-1">
                 <span className="text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                 {onViewDetails && <button onClick={() => { onClose(); onViewDetails(); }} className="text-orange-600 hover:text-orange-800 hover:underline flex items-center"><Info className="w-3 h-3 mr-1" /> View Full Event Details</button>}
               </div>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
           </div>
           
           <div className="px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white sticky top-0 z-10">
              <div className="flex space-x-2 w-full sm:w-auto">
                  <button onClick={() => { setGalleryFilter('OFFICIAL'); resetSelection(); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${galleryFilter === 'OFFICIAL' ? 'bg-orange-100 text-orange-800' : 'text-gray-600 hover:bg-gray-100'}`}>Official Photos</button>
                  {event.isOpenShoot && <button onClick={() => { setGalleryFilter('OPEN_SHOOT'); resetSelection(); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${galleryFilter === 'OPEN_SHOOT' ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'}`}>Open Shoot</button>}
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                 {selectedImageIds.size > 0 ? (
                    <div className="flex items-center space-x-3 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                        <span className="text-sm font-bold text-orange-800">{selectedImageIds.size} Selected</span>
                        <div className="h-4 w-px bg-orange-200"></div>
                        <button onClick={handleDeselectAll} className="text-xs text-orange-600 hover:text-orange-800 hover:underline">Clear</button>
                        <button 
                            onClick={handleSequentialDownload}
                            disabled={isDownloading}
                            className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm bg-orange-600 text-white hover:bg-orange-700 ${isDownloading ? 'opacity-75 cursor-wait' : ''}`}
                        >
                            {isDownloading ? <><Loader className="w-3 h-3 mr-2 animate-spin" /> Downloading...</> : <><Download className="w-3 h-3 mr-2" /> Download Batch</>}
                        </button>
                    </div>
                 ) : (
                    <button onClick={handleSelectAll} className="text-sm text-gray-500 hover:text-gray-900">Select All</button>
                 )}
              </div>
           </div>

           <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
              {currentFilteredSubmissions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {currentFilteredSubmissions.map((sub, idx) => (
                    <div key={sub.id} className={`relative group aspect-square rounded-lg overflow-hidden bg-gray-200 transition-all ${selectedImageIds.has(sub.id) ? 'ring-4 ring-orange-500 ring-offset-2 shadow-lg' : 'hover:shadow-md'}`}>
                        {presignedUrls[sub.id] ? (
                          <img src={presignedUrls[sub.id]} alt="" className="object-cover w-full h-full cursor-zoom-in" onClick={() => setPreviewImage(sub)} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100"><Loader className="w-5 h-5 animate-spin text-gray-300" /></div>
                        )}
                        <div className="absolute top-2 left-2 z-20 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSelectImage(sub.id, idx, e.shiftKey); }}>
                            {selectedImageIds.has(sub.id) ? <div className="bg-orange-500 text-white rounded-md shadow-md"><CheckSquare className="w-6 h-6" /></div> : <div className="bg-black/30 text-white rounded-md shadow-md hover:bg-opacity-50"><Square className="w-6 h-6" /></div>}
                        </div>
                        {isOwner && <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(sub.id); }} className="absolute top-2 right-2 z-20 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 shadow-md"><Trash2 className="w-4 h-4" /></button>}
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] font-bold truncate">{sub.photographerName}</p>
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <p>No photos found in this category.</p>
                </div>
              )}
           </div>
        </div>

        {confirmDelete && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
                    <div className="flex items-center text-red-600 mb-4"><AlertCircle className="w-6 h-6 mr-2" /><h4 className="text-lg font-bold">Permanently Delete?</h4></div>
                    <p className="text-gray-600 text-sm mb-6">This will remove the photo from the event gallery. This action cannot be undone.</p>
                    <div className="flex space-x-3">
                        <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700">Cancel</button>
                        <button onClick={() => { if(confirmDelete) { onDeletePhoto?.(confirmDelete); if(previewImage?.id === confirmDelete) setPreviewImage(null); setConfirmDelete(null); } }} className="flex-1 py-2 bg-red-600 text-white rounded-md text-sm font-bold">Yes, Delete</button>
                    </div>
                </div>
            </div>
        )}
        {previewImage && renderImagePreview()}
    </div>
  );
};

export default GalleryModal;
