const jwt = require('jsonwebtoken');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('./google-sheets-credentials.json'));

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        
        const usersSheet = doc.sheetsByIndex[0];
        const rows = await usersSheet.getRows();
        const user = rows.find(row => row._rawData[0] === decoded.userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        req.user = {
            id: user._rawData[0],
            name: user._rawData[1],
            email: user._rawData[2],
            avatar: user._rawData[6]
        };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;