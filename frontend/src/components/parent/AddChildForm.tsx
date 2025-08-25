import React, { useState } from 'react';
import { parentApi } from '../../services/api';

interface AddChildFormProps {
  onSuccess?: (child: any) => void;
  onCancel?: () => void;
}

interface FormData {
  student_name: string;
  date_of_birth: string;
  gender: string;
  avatar_url: string;
  medical_conditions: string;
  relationship_type: string;
  is_primary_contact: boolean;
  pickup_authorized: boolean;
}

const GENDER_CHOICES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const RELATIONSHIP_CHOICES = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' }
];

const AddChildForm: React.FC<AddChildFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    student_name: '',
    date_of_birth: '',
    gender: '',
    avatar_url: '',
    medical_conditions: '',
    relationship_type: '',
    is_primary_contact: false,
    pickup_authorized: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    // Required field validation
    if (!formData.student_name.trim()) {
      newErrors.student_name = 'First and Last Name is required';
    } else if (formData.student_name.trim().length < 2) {
      newErrors.student_name = 'Name must be at least 2 characters long';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of Birth is required';
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      
      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      } else {
        // Check age limits (1-6 years for nursery)
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        
        const actualAge = age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);
        
        if (actualAge < 1) {
          newErrors.date_of_birth = 'Child must be at least 1 year old';
        } else if (actualAge > 6) {
          newErrors.date_of_birth = 'Child seems too old for nursery school (maximum age: 6 years)';
        }
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.relationship_type) {
      newErrors.relationship_type = 'Relationship type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await parentApi.addChild(formData);
      setSuccessMessage('Child added successfully!');
      
      // Reset form
      setFormData({
        student_name: '',
        date_of_birth: '',
        gender: '',
        avatar_url: '',
        medical_conditions: '',
        relationship_type: '',
        is_primary_contact: false,
        pickup_authorized: true,
      });

      if (onSuccess) {
        onSuccess(response.child);
      }
    } catch (error: any) {
      console.error('Error adding child:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.non_field_errors) {
        setErrors({ non_field_errors: error.response.data.non_field_errors });
      } else {
        setErrors({ non_field_errors: ['Failed to add child. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Child</h2>
        <p className="text-gray-600">Add your child's information to link them to your account</p>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}

      {errors.non_field_errors && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          {errors.non_field_errors.map((error: string, index: number) => (
            <p key={index} className="text-red-600 text-sm">{error}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Name */}
        <div>
          <label htmlFor="student_name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="student_name"
            name="student_name"
            value={formData.student_name}
            onChange={handleChange}
            placeholder="Enter child's first and last name"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.student_name ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.student_name && (
            <p className="mt-1 text-sm text-red-600">{errors.student_name}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.date_of_birth && (
            <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Select gender</option>
            {GENDER_CHOICES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
          )}
        </div>

        {/* Relationship Type */}
        <div>
          <label htmlFor="relationship_type" className="block text-sm font-medium text-gray-700 mb-1">
            Your Relationship to Child <span className="text-red-500">*</span>
          </label>
          <select
            id="relationship_type"
            name="relationship_type"
            value={formData.relationship_type}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.relationship_type ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Select relationship</option>
            {RELATIONSHIP_CHOICES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.relationship_type && (
            <p className="mt-1 text-sm text-red-600">{errors.relationship_type}</p>
          )}
        </div>

        {/* Profile Picture URL (Optional) */}
        <div>
          <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-1">
            Profile Picture URL (Optional)
          </label>
          <input
            type="url"
            id="avatar_url"
            name="avatar_url"
            value={formData.avatar_url}
            onChange={handleChange}
            placeholder="https://example.com/photo.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Medical Conditions */}
        <div>
          <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700 mb-1">
            Medical Conditions / Allergies (Optional)
          </label>
          <textarea
            id="medical_conditions"
            name="medical_conditions"
            value={formData.medical_conditions}
            onChange={handleChange}
            placeholder="Any medical conditions, allergies, or special requirements..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_primary_contact"
              name="is_primary_contact"
              checked={formData.is_primary_contact}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="is_primary_contact" className="ml-2 text-sm text-gray-700">
              I am the primary contact for this child
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="pickup_authorized"
              name="pickup_authorized"
              checked={formData.pickup_authorized}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="pickup_authorized" className="ml-2 text-sm text-gray-700">
              I am authorized to pick up this child
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Child...' : 'Add Child'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddChildForm;