import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Calendar, MapPin, Camera, DollarSign, Plus, Trash2, Check, Lock, Save, UploadCloud, X, Crop as CropIcon, RefreshCw, AlertTriangle, Clock, ShieldAlert, AlertCircle, Search, HardDrive } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Event, JobRole, Coordinates, PhotoPackageType, Bid } from '../types';

declare var google: any;

interface ManageEventProps {
  event: Event;
  bids: Bid[];
  onBack: () => void;
  onUpdate: (event: Event) => void;
  onReschedule: (eventId: string, newDate: string, newTime: string) => void;
}

interface RoleDraft {
  id?: string;
  title: string;
  description: string;
  minBudget: string;
  maxBudget: string;
  filled: boolean;
}

const ManageEvent: React.FC<ManageEventProps> = ({ event, bids, onBack, onUpdate, onReschedule }) => {
  const eventBids = bids.filter(b => b.eventId === event.id && ['PENDING', 'ACCEPTED', 'COUNTERED'].includes(b.status));
  const hasActiveBids = eventBids.length > 0;
  
  const parseDate = (d: string) => {
    if (!d) return new Date();
    return d.includes('T') ? new Date(d) : new Date(d.replace(/-/g, '/'));
  };

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  
  // Date/Time
  const [isAllDay, setIsAllDay] = useState(event.isAllDay || false);
  const [isMultiDay, setIsMultiDay] = useState(!!event.endDate);
  
  const eventDateObj = parseDate(event.date);
  // Using yyyy-mm-dd format for input fields
  const [date, setDate] = useState(eventDateObj.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(event.endDate ? parseDate(event.endDate).toISOString().split('T')[0] : '');
  const [time, setTime] = useState(event.date.includes('T') ? event.date.split('T')[1].slice(0, 5) : '00:00');
  
  const [locationQuery, setLocationQuery] = useState(event.location);
  const [selectedLocationData, setSelectedLocationData] = useState<{
    address: string;
    zipCode: string;
    coordinates: Coordinates;
  } | null>({
    address: event.location,
    zipCode: event.zipCode || '',
    coordinates: event.coordinates || { lat: 0, lng: 0 }
  });
  
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image & Cropping
  const [imageUrl, setImageUrl] = useState(event.imageUrl);
  const [originalImageUrl, setOriginalImageUrl] = useState(event.imageUrl);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [isOpenShoot, setIsOpenShoot] = useState(event.isOpenShoot);
  const [openShootApprovalRequired, setOpenShootApprovalRequired] = useState(event.openShootApprovalRequired !== false);
  const [selectedPackage, setSelectedPackage] = useState<PhotoPackageType>(event.packageType);
  const [roles, setRoles] = useState<RoleDraft[]>(
    event.roles.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        minBudget: r.minBudget.toString(),
        maxBudget: r.maxBudget.toString(),
        filled: r.filled
    }))
  );

  useEffect(() => {
    if ((window as any).google && (window as any).google.maps && autocompleteInputRef.current && !hasActiveBids) {
        const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
            fields: ["formatted_address", "geometry", "address_components", "name"],
            types: ["establishment", "geocode"]
        });
        
        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;

            let zipCode = '';
            if (place.address_components) {
              for (const component of place.address_components) {
                if (component.types.includes('postal_code')) zipCode = component.long_name;
              }
            }
            const locationData = {
                address: place.formatted_address || place.name,
                zipCode,
                coordinates: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
            };
            setLocationQuery(locationData.address);
            setSelectedLocationData(locationData);
        });
    }
  }, [hasActiveBids]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      }, 'image/jpeg');
    });
  };

  const handleApplyCrop = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (croppedImage) {
          setImageUrl(croppedImage);
          setImageToCrop(null);
          setIsCropping(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setOriginalImageUrl(result);
        setImageToCrop(result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReCrop = () => {
    if (originalImageUrl) {
        setImageToCrop(originalImageUrl);
        setIsCropping(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationData) return;

    const updatedEvent: Event = {
      ...event,
      title,
      description,
      date: isAllDay ? date : `${date}T${time || '00:00'}:00`,
      endDate: isMultiDay ? endDate : undefined,
      isAllDay,
      location: selectedLocationData.address,
      zipCode: selectedLocationData.zipCode,
      coordinates: selectedLocationData.coordinates,
      imageUrl: imageUrl,
      isOpenShoot: isOpenShoot,
      openShootApprovalRequired,
      packageType: selectedPackage,
      roles: roles.map(r => ({
        ...r,
        minBudget: Number(r.minBudget),
        maxBudget: Number(r.maxBudget)
      })) as JobRole[]
    };
    onUpdate(updatedEvent);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className="flex items-center text-muted hover:text-espresso transition-colors font-black text-[10px] uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
            </button>
            {hasActiveBids && <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black bg-cream text-espresso border border-black/5 uppercase tracking-widest"><Lock className="w-3.5 h-3.5 mr-2 text-gold" /> Logistics Enforced</span>}
        </div>

        <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-black/5">
          <div className="px-10 py-7 border-b border-gray-100 bg-cream">
            <h1 className="text-2xl font-black text-espresso tracking-tight">Modify Scope</h1>
            <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Update details and delivery tiers.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-12">
            <div className="space-y-10">
              <div className={hasActiveBids ? "opacity-60 cursor-not-allowed" : ""}>
                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-4 flex items-center">Event Timeline {hasActiveBids && <Lock className="w-3 h-3 ml-2 text-gold" />}</label>
                <div className="bg-cream/40 p-6 rounded-[2rem] border border-black/5 space-y-6">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                        <button type="button" disabled={hasActiveBids} onClick={() => setIsAllDay(!isAllDay)} className={`${isAllDay ? 'bg-gold' : 'bg-espresso/10'} relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}>
                            <span className={`${isAllDay ? 'translate-x-4' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition duration-200 ease-in-out`} />
                        </button>
                        <span className="ml-3 text-[10px] font-black text-espresso uppercase tracking-widest">All Day</span>
                        </div>
                        <div className="flex items-center">
                        <button type="button" disabled={hasActiveBids} onClick={() => setIsMultiDay(!isMultiDay)} className={`${isMultiDay ? 'bg-gold' : 'bg-espresso/10'} relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}>
                            <span className={`${isMultiDay ? 'translate-x-4' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition duration-200 ease-in-out`} />
                        </button>
                        <span className="ml-3 text-[10px] font-black text-espresso uppercase tracking-widest">Multi-Day</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">{isMultiDay ? 'Start Date' : 'Date'}</label>
                            <input type="date" required disabled={hasActiveBids} className="block w-full border border-gray-200 rounded-xl py-3 px-4 focus:ring-0 focus:border-gold font-bold text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        {isMultiDay && (
                            <div>
                                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">End Date</label>
                                <input type="date" required disabled={hasActiveBids} className="block w-full border border-gray-200 rounded-xl py-3 px-4 focus:ring-0 focus:border-gold font-bold text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        )}
                        {!isAllDay && (
                            <div className={isMultiDay ? "md:col-span-2" : ""}>
                                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Start Time</label>
                                <input type="time" required disabled={hasActiveBids} className="block w-full border border-gray-200 rounded-xl py-3 px-4 focus:ring-0 focus:border-gold font-bold text-sm" value={time} onChange={(e) => setTime(e.target.value)} />
                            </div>
                        )}
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2 flex items-center">Venue Location {hasActiveBids && <Lock className="w-3 h-3 ml-2 text-gold" />}</label>
                <div className="relative h-12 w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                    <MapPin className="h-4 w-4 text-muted" />
                  </div>
                  <input 
                    ref={autocompleteInputRef}
                    type="text" 
                    required 
                    disabled={hasActiveBids}
                    className="block w-full h-full pl-12 pr-4 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-gold transition-all font-bold text-sm disabled:bg-cream" 
                    value={locationQuery} 
                    onChange={(e) => setLocationQuery(e.target.value)} 
                  />
                </div>
              </div>

              {/* Header Image Update */}
              <div>
                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Update Imagery</label>
                <div className={`border-2 border-dashed rounded-[2rem] p-0 flex flex-col items-center justify-center text-center transition-all aspect-[8/3] overflow-hidden ${imageUrl ? 'border-gold/50 bg-cream' : 'border-gray-200 hover:border-gold hover:bg-cream/50 cursor-pointer'}`} onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                    {imageUrl ? (
                        <div className="relative w-full h-full group">
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleReCrop(); }} className="bg-white rounded-full p-2.5 shadow-xl text-espresso hover:text-gold transition-colors"><CropIcon className="w-5 h-5" /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="bg-white rounded-full p-2.5 shadow-xl text-espresso hover:text-gold transition-colors"><RefreshCw className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 flex flex-col items-center">
                            <UploadCloud className="h-8 w-8 text-gold mb-2" />
                            <span className="text-[10px] font-black text-espresso uppercase tracking-widest">Swap Cover Image</span>
                        </div>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Event Title</label>
                <input type="text" required className="block w-full border border-gray-200 rounded-xl py-3 px-4 focus:ring-0 focus:border-gold font-bold text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="bg-espresso rounded-[2rem] p-8 text-white space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/5 rounded-lg mr-4">
                      <Camera className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <span className="text-sm font-black tracking-tight">Open Shoot Access</span>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-0.5">Allow portfolio-building attendees</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsOpenShoot(!isOpenShoot)} className={`${isOpenShoot ? 'bg-gold' : 'bg-white/10'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}>
                    <span className={`${isOpenShoot ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition duration-200 ease-in-out`} />
                  </button>
                </div>

                {isOpenShoot && (
                   <div className="pt-8 border-t border-white/10 animate-fade-in-up">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-white/5 rounded-lg mr-4">
                            <Clock className="w-5 h-5 text-gold" />
                          </div>
                          <div>
                            <span className="text-sm font-black tracking-tight">Require Approval</span>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-0.5">Moderate entrants before transmission</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setOpenShootApprovalRequired(!openShootApprovalRequired)} className={`${openShootApprovalRequired ? 'bg-gold' : 'bg-white/10'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}>
                          <span className={`${openShootApprovalRequired ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition duration-200 ease-in-out`} />
                        </button>
                      </div>
                   </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={onBack} className="px-8 py-3 border border-black/10 rounded-xl text-[10px] font-black text-muted uppercase tracking-widest">Cancel</button>
                <button type="submit" className="px-10 py-3 bg-gold text-espresso rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      {isCropping && imageToCrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-espresso/95 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-cream">
              <h3 className="text-lg font-black text-espresso tracking-tight">Frame Selection</h3>
              <button onClick={() => setIsCropping(false)} className="text-muted hover:text-espresso transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="relative flex-grow bg-espresso min-h-[400px]">
              <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={8 / 3} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-8 bg-white space-y-6">
              <div className="flex items-center space-x-6">
                <span className="text-[10px] font-black text-espresso uppercase tracking-widest">Zoom Level</span>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-gold" />
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsCropping(false)} className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-muted hover:bg-gray-50 transition-all">Cancel</button>
                <button type="button" onClick={handleApplyCrop} className="px-10 py-3 bg-espresso text-gold rounded-xl text-sm font-black shadow-xl transition-all flex items-center"><Check className="w-4 h-4 mr-2" /> Apply Transformation</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvent;