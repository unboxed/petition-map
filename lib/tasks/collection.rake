require 'open-uri'
require 'json'
require 'pry'

task :refresh do
  response = JSON.parse open('https://petition.parliament.uk/petitions.json?state=open').read

  File.open("public/json/#{petition['id']}.json", 'w') do |file|
    file.write(response)
  end

  response['data'].each do |petition|
    puts "Saving: #{petition['attributes']['action']}"
    File.open("public/json//petitions/#{petition['id']}.json", 'w') do |file|
      file.write(open("https://petition.parliament.uk/petitions/#{petition['id']}.json").read)
    end
  end
end
