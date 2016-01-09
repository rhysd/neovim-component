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

guard :shell do
  watch %r[^src/.+\.tsx?$] do |m|
    npm_run(:build, m[0])
  end

  watch %r[^test/.+\.js$] do |m|
    npm_run(:test, m[0])
  end
end
