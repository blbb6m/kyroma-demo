import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Calendar, MapPin, Camera, DollarSign, Plus, Trash2, Check, UploadCloud, Info, X, Crop as CropIcon, HardDrive, RefreshCw, AlertTriangle, Clock, Loader } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Event, JobRole, Coordinates, PhotoPackageType } from '../types';

declare var google: any;

interface CreateEventProps {
  onBack: () => void;
  onSave: (event: Omit<Event, 'id' | 'ownerId'>) => void;
}

interface RoleDraft {
  title: string;
  description: string;
  minBudget: string;
  maxBudget: string;
}

const CreateEvent: React.FC<CreateEventProps> = ({ onBack, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Date/Time States
  const [isAllDay, setIsAllDay] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocationData, setSelectedLocationData] = useState<{
    address: string;
    zipCode: string;
    coordinates: Coordinates;
  } | null>(null);
  
  const [locationError, setLocationError] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image & Cropping States
  const [imageUrl, setImageUrl] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [isOpenShoot, setIsOpenShoot] = useState(true);
  const [openShootApprovalRequired, setOpenShootApprovalRequired] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PhotoPackageType>(PhotoPackageType.BASIC);
  const [roles, setRoles] = useState<RoleDraft[]>([]);

  const PACKAGES = {
    [PhotoPackageType.BASIC]: { 
      label: 'Basic Hosting', 
      limit: 100,
      price: 19, 
      desc: 'Small events, community meetups, and local gatherings.' 
    },
    [PhotoPackageType.STANDARD]: { 
      label: 'Pro Delivery', 
      limit: 500,
      price: 49, 
      desc: 'Perfect for social events, parties, and corporate functions.' 
    },
    [PhotoPackageType.PREMIUM]: { 
      label: 'Elite Archival', 
      limit: 2000,
      price: 99, 
      desc: 'High-end galas, weddings, and full-scale productions.' 
    },
  };

  const showPrice = !isOpenShoot || roles.length > 0;
  const draftTotalPrice = showPrice ? PACKAGES[selectedPackage].price : 0;

  useEffect(() => {
    if ((window as any).google && (window as any).google.maps && autocompleteInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
            fields: ["formatted_address", "geometry", "address_components", "name"],
            types: ["establishment", "geocode"]
        });
        
        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
                setLocationError("Please select a valid location from the suggestions.");
                setSelectedLocationData(null);
                return;
            }

            let zipCode = '';
            if (place.address_components) {
                for (const component of place.address_components) {
                    if (component.types.includes('postal_code')) {
                        zipCode = component.long_name;
                        break;
                    }
                }
            }

            const locationData = {
                address: place.formatted_address || place.name,
                zipCode: zipCode,
                coordinates: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                }
            };

            setLocationQuery(locationData.address);
            setSelectedLocationData(locationData);
            setLocationError('');
        });
    }
  }, []);

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

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleAddRole = () => {
    setRoles([...roles, { title: '', description: '', minBudget: '', maxBudget: '' }]);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedLocationData) {
      setLocationError("Please select a location from the dropdown suggestions.");
      setFormError("Location Selection Required: Please type your venue address and select the matching result from the dropdown list.");
      return;
    }
    if (roles.length === 0 && !isOpenShoot) {
        setFormError("Participation requirement: Please add at least one paid role or enable 'Open Shoot'.");
        return;
    }

    setIsSubmitting(true);
    try {
      const newEvent: Omit<Event, 'id' | 'ownerId'> = {
        title,
        description,
        date: isAllDay ? date : `${date}T${time || '00:00'}:00`,
        endDate: isMultiDay ? endDate : undefined,
        isAllDay,
        location: selectedLocationData.address,
        zipCode: selectedLocationData.zipCode,
        coordinates: selectedLocationData.coordinates,
        imageUrl: imageUrl || `https://picsum.photos/800/300?random=${Math.floor(Math.random() * 1000)}`,
        isOpenShoot,
        openShootApprovalRequired: isOpenShoot ? openShootApprovalRequired : undefined,
        packageType: selectedPackage,
        photoLimit: PACKAGES[selectedPackage].limit,
        roles: roles.map((r, idx) => ({
          id: `new-role-${idx}`,
          title: r.title || 'Untitled Role',
          description: r.description || '',
          minBudget: Number(r.minBudget) || 0,
          maxBudget: Number(r.maxBudget) || 0,
          filled: false
        })) as JobRole[],
        status: 'OPEN',
        tags: ['New']
      };
      await onSave(newEvent);
    } catch (err) {
      console.error(err);
      setFormError("An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center text-muted hover:text-espresso transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
        </button>

        <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-black/5">
          <div className="px-8 py-6 border-b border-gray-100 bg-cream">
            <h1 className="text-2xl font-black text-espresso tracking-tight">Host New Event</h1>
            <p className="text-sm text-muted">Secure world-class visuals for your next project.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Event Title</label>
                <input type="text" required className="block w-full border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-gold/30 focus:border-gold focus:outline-none transition-all font-bold text-sm" placeholder="e.g. 10th Anniversary Charity Gala" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Event Brief</label>
                <textarea required rows={4} className="block w-full border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-gold/30 focus:border-gold focus:outline-none transition-all font-bold text-sm" placeholder="Tell our professionals about your vision..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              {/* Date & Time */}
              <div className="bg-cream/40 p-6 rounded-[2rem] border border-black/5 space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <button type="button" onClick={() => setIsAllDay(!isAllDay)} className={`${isAllDay ? 'bg-gold' : 'bg-espresso/10'} relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}>
                        <span className={`${isAllDay ? 'translate-x-4' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition duration-200 ease-in-out`} />
                      </button>
                      <span className="ml-3 text-[10px] font-black text-espresso uppercase tracking-widest">All Day</span>
                    </div>
                    <div className="flex items-center">
                      <button type="button" onClick={() => setIsMultiDay(!isMultiDay)} className={`${isMultiDay ? 'bg-gold' : 'bg-espresso/10'} relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}>
                        <span className={`${isMultiDay ? 'translate-x-4' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition duration-200 ease-in-out`} />
                      </button>
                      <span className="ml-3 text-[10px] font-black text-espresso uppercase tracking-widest">Multi-Day</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">{isMultiDay ? 'Start Date' : 'Date'}</label>
                    <input type="date" required className="block w-full border border-gray-200 rounded-2xl py-3 px-4 focus:ring-0 focus:border-gold font-bold text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  {isMultiDay && (
                    <div>
                      <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">End Date</label>
                      <input type="date" required className="block w-full border border-gray-200 rounded-2xl py-3 px-4 focus:ring-0 focus:border-gold font-bold text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  )}
                  {!isAllDay && (
                    <div className={isMultiDay ? "md:col-span-2" : ""}>
                      <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Start Time</label>
                      <input type="time" required className="block w-full border border-gray-200 rounded-2xl py-3 px-4 focus:ring-0 focus:border-gold font-bold text-sm" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="relative">
                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Venue Location</label>
                <div className="relative h-12 w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                    <MapPin className="h-4 w-4 text-muted" />
                  </div>
                  <input 
                    ref={autocompleteInputRef}
                    type="text" 
                    required 
                    className="block w-full h-full pl-12 pr-4 border-2 border-gray-100 rounded-xl focus:border-gold focus:ring-0 transition-all font-bold text-sm" 
                    placeholder="Search for a venue address..." 
                    value={locationQuery} 
                    onChange={(e) => setLocationQuery(e.target.value)} 
                  />
                </div>
                {locationError && <p className="text-[10px] text-error mt-2 font-black uppercase tracking-widest">{locationError}</p>}
              </div>
              
              {/* Header Image */}
              <div>
                <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Header Imagery</label>
                <div className={`border-2 border-dashed rounded-[2rem] p-0 flex flex-col items-center justify-center text-center transition-all aspect-[8/3] overflow-hidden ${imageUrl ? 'border-gold/50 bg-cream' : 'border-gray-200 hover:border-gold hover:bg-cream/50 cursor-pointer'}`} onClick={!imageUrl ? triggerFileInput : undefined}>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                    {imageUrl ? (
                        <div className="relative w-full h-full group">
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleReCrop(); }} className="bg-white rounded-full p-2.5 shadow-xl text-espresso hover:text-gold transition-colors"><CropIcon className="w-5 h-5" /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }} className="bg-white rounded-full p-2.5 shadow-xl text-espresso hover:text-gold transition-colors"><RefreshCw className="w-5 h-5" /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setImageUrl(''); setOriginalImageUrl(''); }} className="bg-white rounded-full p-2.5 shadow-xl text-error hover:scale-110 transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 flex flex-col items-center">
                            <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                              <UploadCloud className="h-8 w-8 text-gold" />
                            </div>
                            <span className="text-sm font-black text-espresso uppercase tracking-widest">Upload Cover</span>
                        </div>
                    )}
                </div>
              </div>

              {/* Hosting Tier Selection */}
              {showPrice && (
                <div className="bg-cream rounded-[2rem] p-8 border border-black/5 animate-fade-in-up">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-espresso rounded-lg mr-3">
                      <HardDrive className="w-4 h-4 text-gold" />
                    </div>
                    <h3 className="text-xs font-black text-espresso uppercase tracking-[0.2em]">Hosting Tier</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(PACKAGES).map(([pkgType, config]) => (
                          <div key={pkgType} onClick={() => setSelectedPackage(pkgType as PhotoPackageType)} className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col justify-between transition-all active:scale-[0.98] ${selectedPackage === pkgType ? 'border-gold bg-white shadow-xl shadow-gold/10' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                              <div>
                                  <div className="flex justify-between items-center mb-1">
                                      <span className={`text-sm font-black tracking-tight ${selectedPackage === pkgType ? 'text-gold' : 'text-espresso'}`}>{config.label}</span>
                                      {selectedPackage === pkgType && <Check className="w-4 h-4 text-gold" />}
                                  </div>
                                  <p className="text-[10px] text-muted font-bold leading-tight mb-4 uppercase">{config.desc}</p>
                              </div>
                              <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                  <span className="text-xs font-black text-espresso">${config.price}</span>
                                  <span className="text-[8px] text-muted font-black uppercase tracking-widest">Rate</span>
                              </div>
                          </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Open Shoot Configuration */}
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
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-0.5">Review entrants before transmission</p>
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

            {/* Paid Staffing Roles */}
            <div className="border-t border-gray-100 pt-8">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-espresso tracking-tight">Professional Staffing</h3>
                 <button type="button" onClick={handleAddRole} className="inline-flex items-center text-xs font-black text-gold uppercase tracking-widest hover:text-espresso transition-colors">
                   <Plus className="w-4 h-4 mr-2" /> Add Position
                 </button>
              </div>
              
              {roles.length === 0 ? (
                <div className="bg-cream rounded-[1.5rem] border border-black/5 p-10 text-center text-muted font-black text-[10px] uppercase tracking-widest">
                    No paid roles configured
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.map((role, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 relative group shadow-sm">
                      <button type="button" onClick={() => setRoles(roles.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                           <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Position Title</label>
                           <input type="text" required placeholder="e.g. Lead Visualist" className="block w-full border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-gold/30 focus:border-gold focus:outline-none font-bold text-sm" value={role.title} onChange={(e) => {
                               const newRoles = [...roles];
                               newRoles[idx].title = e.target.value;
                               setRoles(newRoles);
                           }} />
                         </div>
                         <div>
                           <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Budget Allocation ($)</label>
                           <div className="flex items-center space-x-2">
                              <input type="number" min="0" required placeholder="Min" className="block w-full border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-gold/30 focus:border-gold focus:outline-none font-bold text-sm" value={role.minBudget} onChange={(e) => {
                                  const newRoles = [...roles];
                                  newRoles[idx].minBudget = e.target.value;
                                  setRoles(newRoles);
                              }} />
                              <span className="text-gray-300 font-bold">—</span>
                              <input type="number" required placeholder="Max" className="block w-full border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-gold/30 focus:border-gold focus:outline-none font-bold text-sm" value={role.maxBudget} onChange={(e) => {
                                  const newRoles = [...roles];
                                  newRoles[idx].maxBudget = e.target.value;
                                  setRoles(newRoles);
                              }} />
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-8 flex flex-col items-end gap-6 border-t border-gray-100">
              {formError && (
                <div className="w-full flex items-start bg-error/5 border border-error/20 p-4 rounded-2xl text-error animate-fade-in-up">
                  <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                  <p className="text-sm font-black">{formError}</p>
                </div>
              )}
              
              <div className="bg-espresso rounded-[3rem] p-10 text-white w-full flex flex-col sm:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group mb-4">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity"><HardDrive className="w-56 h-56" /></div>
                <div className="w-full sm:w-auto relative z-10 text-center sm:text-left">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Projected Handoff Level</p>
                    <div className="flex items-center justify-center sm:justify-start">
                        <span className="text-5xl font-black text-white tracking-tighter">{PACKAGES[selectedPackage].label}</span>
                        {!showPrice && (
                           <span className="ml-4 bg-gold text-espresso text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-xl">Open Access</span>
                        )}
                    </div>
                </div>
                
                <div className="w-full sm:w-auto text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-10 sm:pt-0 sm:pl-16 relative z-10">
                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Total Hosting Fee</p>
                    <div className="text-7xl font-black text-white flex items-center justify-center sm:justify-end tracking-tighter">
                        <span className="text-3xl font-black mr-2 text-white/20">$</span>
                        {draftTotalPrice}
                    </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto px-12 py-4 font-black text-espresso bg-gold hover:bg-[#E5B63D] rounded-[1.2rem] shadow-xl shadow-gold/20 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : 'Publish Marketplace Event'}
              </button>
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

export default CreateEvent;