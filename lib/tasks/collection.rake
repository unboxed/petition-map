require 'open-uri'
require 'json'
require 'pry'

task :refresh do
  response = open('https://petition.parliament.uk/petitions.json?state=open').read

  File.open("public/json/petitions/petitions.json", 'w') do |file|
    file.write(response)
  end

  JSON.parse(response)['data'].each do |petition|
    puts "Saving: #{petition['attributes']['action']}"
    File.open("public/json//petitions/#{petition['id']}.json", 'w') do |file|
      file.write(open("https://petition.parliament.uk/petitions/#{petition['id']}.json").read)
    end
  end
end
