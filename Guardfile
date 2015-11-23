ignore /^node_modules/, /^build/, /^typings/, /^bower_components/

guard :shell do
  watch %r[^.+\.tsx?$] do |m|
  puts "\033[93m#{Time.now}: #{File.basename m[0]}\033[0m"
    success = system 'rake build'
    if success
      puts "\033[92mOK\033[0m\n\n"
    else
      puts "\033[91mFAIL\033[0m\n\n"
    end
  end
end
