ignore /^node_modules/, /^build/, /^typings/, /^bower_components/

def npm_run(sub, file)
  puts "\033[93m#{Time.now}: #{File.basename file}\033[0m"
  success = system "npm run #{sub}"
  if success
    puts "\033[92mOK\033[0m\n\n"
  else
    puts "\033[91mFAIL\033[0m\n\n"
  end
end

def exec(cmdline)
  success = system cmdline
  if success
    puts "\033[92mOK\033[0m\n\n"
  else
    puts "\033[91mFAIL\033[0m\n\n"
  end
end

guard :shell do
  watch %r[^src/.+\.tsx?$] do |m|
    puts "\033[93m#{Time.now}: #{File.basename m[0]}\033[0m"
    exec 'npm run build'
  end

  watch %r[^test/.+\.js$] do |m|
    puts "\033[93m#{Time.now}: Test #{File.basename m[0]}\033[0m"
    exec "./node_modules/.bin/mocha #{m[0]}"
  end
end
