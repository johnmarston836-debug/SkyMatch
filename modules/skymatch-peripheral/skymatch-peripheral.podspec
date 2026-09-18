require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "skymatch-peripheral"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/johnmarston836-debug/SkyMatch"
  s.license      = "MIT"
  s.authors      = { "EFS" => "noreply@example.com" }
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :path => "." }
  s.source_files = "ios/**/*.{h,m}"
  s.frameworks   = "CoreBluetooth"

  install_modules_dependencies(s)
end
