#!/usr/bin/env ruby
# Bulk building submission script
# Run via: heroku run --app boiling-atoll-02251 -- rails runner /path/to/bulk-submit.rb
# Or pipe via heredoc: heroku run ... -- rails runner - <<'RUBY' ... RUBY
#
# Reads a JSON manifest from STDIN or ENV['MANIFEST'] and:
# 1. Creates BuildingAnalysis records
# 2. Downloads images from URLs → uploads to S3
# 3. Enqueues GPT analysis jobs
#
# Manifest format (JSON array):
# [
#   {
#     "name": "Sagrada Família",
#     "city": "Barcelona",
#     "address": "Carrer de Mallorca, 401, Barcelona, Spain",
#     "latitude": 41.4036,
#     "longitude": 2.1744,
#     "image_url": "https://upload.wikimedia.org/...",
#     "visible": true
#   },
#   ...
# ]

require 'aws-sdk-s3'
require 'open-uri'
require 'json'

ATLAS_USER_ID = 880
S3_BUCKET = 'architecture-explorer'
S3_REGION = 'us-east-2'

manifest = JSON.parse(ENV['MANIFEST'] || STDIN.read)
puts "=== Bulk Submit: #{manifest.length} buildings ==="

s3 = Aws::S3::Resource.new(region: S3_REGION)
bucket = s3.bucket(S3_BUCKET)

results = []

manifest.each_with_index do |bldg, idx|
  name = bldg['name']
  print "[#{idx+1}/#{manifest.length}] #{name}... "

  begin
    # 1. Create the record (skip geocoding by setting lat/lng directly)
    ba = BuildingAnalysis.new(
      name: name,
      city: bldg['city'],
      address: bldg['address'],
      latitude: bldg['latitude'],
      longitude: bldg['longitude'],
      user_id: ATLAS_USER_ID,
      visible_in_library: bldg.fetch('visible', true)
    )
    # Skip geocoding callback by setting coords before save
    ba.save!
    puts "created ##{ba.id}"

    # 2. Download image → S3
    if bldg['image_url'].present?
      print "  Downloading image... "
      begin
        image_data = URI.open(bldg['image_url'],
          "User-Agent" => "ArchitectureHelper/1.0 (atlas@architecturehelper.com)",
          read_timeout: 30
        )
        ext = File.extname(URI.parse(bldg['image_url']).path).split('?').first
        ext = '.jpg' if ext.blank?
        file_name = "building_#{ba.id}_#{Time.now.to_i}#{ext}"
        object_key = "uploads/#{file_name}"

        obj = bucket.object(object_key)
        obj.upload_file(image_data.path)
        s3_url = obj.public_url
        ba.update!(image_url: s3_url)
        puts "✅ S3: #{s3_url}"
        image_data.close if image_data.respond_to?(:close)
        sleep 2 # Wikimedia rate limit
      rescue => e
        puts "❌ image failed: #{e.message.split("\n").first}"
      end
    end

    # 3. Enqueue GPT analysis
    if ba.image_url.present?
      ProcessBuildingAnalysisJob.perform_later(ba.id, ba.image_url, ba.address)
      puts "  GPT analysis enqueued"
    end

    results << { id: ba.id, name: name, status: 'ok' }
  rescue => e
    puts "❌ FAILED: #{e.message.split("\n").first}"
    results << { id: nil, name: name, status: 'error', error: e.message.split("\n").first }
  end
end

puts "\n=== Results ==="
results.each do |r|
  puts "#{r[:status] == 'ok' ? '✅' : '❌'} ##{r[:id]} #{r[:name]} — #{r[:status]}"
end
puts "#{results.count { |r| r[:status] == 'ok' }}/#{results.length} succeeded"
