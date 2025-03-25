class Share < ApplicationRecord
  belongs_to :server
  belongs_to :directory
  belongs_to :filename
  belongs_to :data, class_name: 'Datum', optional: true

  def irc_link
    "!#{server.name} #{filename.name}"
  end

  def self.parse(file)
    first_seen = false
    dir = nil
    server = nil

    file.each do |line|
      if line.strip! =~ /^=+$/
        first_seen = true
        next
      end
      next unless first_seen
      if line.strip.empty?
        dir = nil
        next
      end
      if dir.nil?
        dir = Directory.find_or_create_by!(
          name: line
        )
        next
      end
      Rails.logger.info "Processing: #{line}"
      line =~ /!([^ ]+) (.+?) * ::INFO:: (.+)$/
      if server.nil? || server.name != $1
        server = Server.find_or_create_by!(
          name: $1
        )
      end
      filename = Filename.find_or_create_by!(
        name: $2
      )
      Share.find_or_create_by!(
        server: server,
        directory: dir,
        filename: filename
      )
    end
  end
end
