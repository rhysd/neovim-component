require 'fileutils'
include FileUtils

ROOT = __dir__.freeze
BIN = "#{ROOT}/node_modules/.bin".freeze

def cmd_exists?(cmd)
  File.exists?(cmd) && File.executable?(cmd)
end

def ensure_cmd(cmd)
  $cmd_cache ||= []
  return true if $cmd_cache.include? cmd

  paths = ENV['PATH'].split(':').uniq
  unless paths.any?{|p| cmd_exists? "#{p}/#{cmd}" }
    raise "'#{cmd}' command doesn't exist"
  else
    $cmd_cache << cmd
  end
end

file 'node_modules' do
  ensure_cmd 'npm'
  sh 'npm install'
end

file 'bower_components' do
  ensure_cmd 'bower'
  sh 'bower install'
end

file "typings" do
  ensure_cmd 'tsd'
  sh 'tsd install'
end

task :dep => [:node_modules, :bower_components, :typings]

task :build => [:dep] do
  mkdir_p 'build'
  sh "#{BIN}/tsc -p #{ROOT}/src"
  sh "#{BIN}/browserify -d -o #{ROOT}/build/index.js #{ROOT}/src/out/index.js"
end

task :example do
  sh "#{BIN}/electron #{ROOT}/example"
end

task :default => %i(build example)

task :lint do
  ensure_cmd 'tslint'
  sh "tslint #{Dir['./**/*.ts'].join(' ')}"
end

task :test do
  puts "Not available now :("
end
