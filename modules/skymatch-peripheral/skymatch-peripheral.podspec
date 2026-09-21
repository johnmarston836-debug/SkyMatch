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
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.swift_version = "5.0"
  # The Swift half is reached from Objective-C++ through the generated
  # `skymatch_peripheral-Swift.h`, which only exists if the pod defines a
  # module.
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }
  s.frameworks   = "CoreBluetooth", "UserNotifications"

  install_modules_dependencies(s)
end
