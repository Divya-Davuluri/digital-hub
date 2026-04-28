exports.getProfile = (req, res) => {
  res.json({
    id: '1',
    name: 'Admin User',
    role: 'Agency Owner',
    email: 'admin@marketinghub.com'
  });
};
