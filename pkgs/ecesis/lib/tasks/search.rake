namespace :search do
  desc 'Search for missing data'

  task irc: :environment do
    require "cinch"
    require "cinch/helpers"

    bot = Cinch::Bot.new do
      admin = nil

      configure do |c|
        c.server   = "irc.irchighway.net"
        c.channels = ['#cinch-bots', '#ebooks']
        c.nick = 'hugobot'
      end

      on :message, /idx (.*)/ do |m|
        admin ||= m.user
        svr = m.message.sub(/^idx /, '')
        m.bot.channels[1].send("@#{svr}")
        m.reply "Requesting List from '#{svr}' in #ebooks"
      end

      on :message, /dl (.*)/ do |m|
        admin ||= m.user
        cmd = m.message.sub(/^dl /, '')
        m.bot.channels[1].send(cmd)
        m.reply "Sending '#{cmd}' to #ebooks"
      end

      on :message, /Type:.*For My List Of:.*Files/ do |m|
        msg = m.message.gsub(/\u0003\d+,?\d*\u0095?\u0096?/, '')
        admin.send("Pong: #{msg}")
      end

      on :message, /ping/ do |m|
        admin ||= m.user
        m.reply("Ping: You are#{admin != m.user ? ' not' : ''} the admin.")
      end

      on :message, /bb/ do |m|
        byebug
      end

      on :dcc_send do |m, dcc|
        if dcc.from_private_ip? || dcc.from_localhost?
          m.bot.loggers.debug "Not accepting potentially dangerous file transfer"
          return
        end

        admin&.send("Accepting: #{dcc.filename}")
        filename = "#{Rails.root}/tmp/#{dcc.filename}"

        File.open(filename, 'wb') do |f|
          dcc.accept(f)
        end

        admin&.send("Saved: #{dcc.filename}")

        require 'zip'
        Zip.on_exists_proc = true

        Zip::File.open(filename) do |zipfile|
          zipfile.each do |entry|
            entry.extract
            shares = Share.parse(entry.get_input_stream)
            cnt = shares.length
            admin.send(
              "Imported #{cnt} #{'Share'.pluralize(cnt)}"
            )
          end
        end
      end

      on :privmsg do |m|
        puts "Here"
        if m.message =~ /^\001DCC SEND (?:"([^"]+)"|(\S+)) (\S+) (\d+)(?: (\d+))?\001$/
          puts "Match Vanilla SEND"
        elsif match = m.message.match(/^\u0001DCC SEND (?:"([^"]+)"|(\S+)) (\S+) (\d+)(?: (\d+))?(?: (\d+))?\u0001$/)
          require 'ipaddr'

          filename = match[1] || match[2]
          IPAddr.new(match[3], Socket::AF_INET6)

          puts "Reverse Send"
        end
      end
    end
    bot.start
  end
end