const ProfileModel = require("../models/profile.model");
const FileUploadService = require("../../file-uploads/services/fileUpload.service");
const fs = require('fs').promises;

class ProfileService {
  static async createOrUpdateProfile(tenant_id, data, profileFile) {
    let profileImageUrl;

    if (profileFile) {
      try {
        profileImageUrl = await FileUploadService.saveFile(profileFile, {
          tenantId: tenant_id,
          category: 'profiles',
          prefix: 'profile_'
        });
        data.profileImage = profileImageUrl;
      } catch (uploadError) {
        console.error('Error al subir la imagen de perfil:', uploadError);
        throw uploadError; 
      }
    }

    // Limpiar testimonios de _id temporales antes de guardar
    if (data.testimonials && Array.isArray(data.testimonials)) {
      data.testimonials = data.testimonials.map(testimonial => {
        const cleanTestimonial = { ...testimonial };
        // Remover _id temporales que empiecen con 'temp_'
        if (cleanTestimonial._id && cleanTestimonial._id.toString().startsWith('temp_')) {
          delete cleanTestimonial._id;
        }
        return cleanTestimonial;
      });
    }

    const profile = await ProfileModel.findOneAndUpdate(
      { tenant_id },
      { $set: data },
      { new: true, upsert: true }
    );
    return profile;
  }

  static async getProfile(tenant_id) {
    const profile = await ProfileModel.findOne({ tenant_id });
    console.log('Profile fetched from DB:', profile);
    return profile;
  }

  static async deleteProfile(tenant_id) {
    const profileToDelete = await ProfileModel.findOne({ tenant_id });
    if (profileToDelete && profileToDelete.profileImage) {
      try {
        await FileUploadService.deleteFile(profileToDelete.profileImage);
        console.log('Imagen de perfil eliminada:', profileToDelete.profileImage);
      } catch (deleteError) {
        console.error('Error al eliminar la imagen de perfil:', deleteError);
      }
    }
    return ProfileModel.deleteOne({ tenant_id });
  }

  static async listProfilesByTenant(tenant_id, page = 1, limit = 10) {
    return ProfileModel.find({ tenant_id })
      .skip((page - 1) * limit)
      .limit(limit);
  }
}

module.exports = ProfileService;