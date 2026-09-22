// Autolinking: the iOS side is the podspec, the Android side this package.
module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.skymatch.peripheral.SkyMatchPeripheralPackage;',
        packageInstance: 'new SkyMatchPeripheralPackage()',
      },
    },
  },
};
