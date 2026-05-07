const Attachment = require('../models/Attachment');
const FileUploadService = require('../../../core/file-uploads/services/fileUpload.service');

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { customerId, opportunityId, activityId } = req.body;
    const fileUrl = FileUploadService.getPublicUrl(
      req.user.tenantId.toString(),
      'general',
      req.file.filename
    );
    const attachment = await Attachment.create({
      tenantId: req.user.tenantId,
      fileUrl,
      originalName: req.file.originalname,
      uploadedBy: req.user._id,
      relatedTo: { customerId, opportunityId, activityId },
      type: req.file.mimetype,
      size: req.file.size
    });
    res.status(201).json(attachment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAttachments = async (req, res) => {
  try {
    const filter = { tenantId: req.user.tenantId };
    if (req.query.customerId) filter['relatedTo.customerId'] = req.query.customerId;
    if (req.query.opportunityId) filter['relatedTo.opportunityId'] = req.query.opportunityId;
    if (req.query.activityId) filter['relatedTo.activityId'] = req.query.activityId;
    const attachments = await Attachment.find(filter);
    res.json(attachments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });
    await FileUploadService.deleteFile(attachment.fileUrl);
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 