# coding: utf-8
namespace :export do
  desc 'Export data to external sources'

  task(dirs: :environment) do |t|
    paths = []

    endpoints = Content.all.includes(:book).map(&:book)
    pattern = [:book, :by, '#{author}', '#{title}']
    endpoints.each do |book|
      data = {
        author: book.author,
        title: book.title,
      }
      path = pattern.map do |pat|
        pat.to_s.gsub(/\#\{(\w+)\}/) { data[$1.to_sym].to_s }
      end
      paths.push({
        path: path,
        ipfs_id: book.data.first&.ipfs_id
      })
    end

    endpoints = Award.all
    patterns = [
      [:award, '#{award}', '#{year}', '#{author} - #{title}'],
      [:award, '#{award}', '#{year}', '#{category}', '#{author} - #{title}'],
      [:award, '#{award}', '#{category}', '#{author} - #{title}'],
      [:award, '#{award}', '#{category}', '#{year}', '#{author} - #{title}'],
      [:book, :by, '#{author}', '#{title}']
    ]
    endpoints.each do |award|
      award.years.each do |year|
        year.categories.where(
          name: ['Best Novel', 'Best Novella', 'Best Short Story']
        ).each do |cat|
          Entry.where(
            award: award,
            year: year,
            category: cat
          )
          .includes(:nominee)
          .map(&:nominee)
          .each do |book|
            data = {
              award: award,
              year: year,
              category: cat,
              author: book.author,
              title: book.title,
            }
            patterns.each do |pattern|
              path = pattern.map do |pat|
                pat.to_s.gsub(/\#\{(\w+)\}/) { data[$1.to_sym].to_s }
              end
              paths.push({
                path: path,
                ipfs_id: book.data.first&.ipfs_id
              })
            end
          end
        end
      end
    end

    puts paths.to_json
  end

  # Broken: max filename is 255 characters, so switched to gutenjson
  task(gutenlinks: :environment) do |t|
    def escape(str) # percent escapes only percent & slash for readability
      str.to_s[0..254].gsub('%', '%25').gsub('/', '%2F').gsub("\u0000", '%00')
    end

    def symlink(path, link, dest)
      FileUtils.makedirs(File.join(path))
      FileUtils.cd(File.join(path))
      unless File.symlink?(link)
        #FileUtils.symlink( # won't create broken links
        system('ln', '-s', File.join(dest), link)
      end
      FileUtils.cd(File.join(Array.new(path.size, '..')))
      puts "#{link} → #{data.url}"
    end
    
    Datum.where('gutenberg_id IS NOT NULL').find_each do |data|
      data.books.each do |book|
        gdir = data.gutenberg_id.split('')[0..-2] + [data.gutenberg_id]
        if book.author
          symlink(
            %W[tmp book by #{escape(book.author)}],
            escape(book.title),
            %w[... gutenberg] + gdir
          )
        end
        name = escape("#{book.title}#{book.author && ", by #{book.author}"}")
        symlink(%w[tmp book], name, %w[... gutenberg] + gdir)
      end
    end
  end

  task(gutenjson: :environment) do |t|
    # collision with a predefined method?
    def linkk(src, dest, out)
      out.push({
        type: :link, source: src, destination: dest,
      })
      $stderr.puts "#{File.join(src)} → #{File.join(dest)}"
    end
    
    out = []

    Datum.where('gutenberg_id IS NOT NULL').distinct.find_each do |data|
      data.books.distinct.each do |book|
        gdir = data.gutenberg_id.split('')[0..-2] + [data.gutenberg_id]
        if book.author
          linkk(
            %W[book by #{book.author} #{book.title}],
            %w[gutenberg] + gdir,
            out
          )
        end
        name = "#{book.title}#{book.author && ", by #{book.author}"}"
        linkk(%w[book] + [name], %w[gutenberg] + gdir, out)
      end
    end

    parent = "tmp/gutenlinks-#{Time.now.iso8601}"

    out.each_slice(5000).with_index do |part, idx|
      dir = "#{parent}/#{idx + 1}"
      FileUtils.makedirs(dir)
      File.open("#{dir}/json", 'w') do |file|
        file << part.to_json
      end
      puts "Wrote: #{dir}/json"
    end
  end
end
