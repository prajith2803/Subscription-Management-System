import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { portalApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export const PortalProfilePage: React.FC = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: portalApi.getProfile,
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [taxId, setTaxId] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setCompany(profile.company || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setCountry(profile.country || '');
      setPincode(profile.pincode || '');
      setTaxId(profile.taxId || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: portalApi.updateProfile,
    onSuccess: () => {
      toast.success('Profile details updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      phone,
      company,
      address,
      city,
      state,
      country,
      pincode,
      taxId,
    });
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Profile</h1>
        <p className="text-sm text-slate-500">Update company credentials and tax invoicing information</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} />
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="GSTIN / Tax ID" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="27ABCDE1234F1Z5" />
            <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
          </div>

          <Input label="Billing Street Address" value={address} onChange={(e) => setAddress(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
            <Input label="PIN / Postal Code" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

