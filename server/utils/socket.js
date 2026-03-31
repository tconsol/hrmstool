/**
 * Socket.IO instance singleton.
 * Set once in server.js, accessed everywhere via getIO().
 */
let _io = null;

const setIO = (io) => {
  _io = io;
};

const getIO = () => {
  if (!_io) throw new Error('Socket.IO not initialized');
  return _io;
};

module.exports = { setIO, getIO };
