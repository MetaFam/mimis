class PagesController < ApplicationController
  protect_from_forgery with: :null_session

  def import
    @title = 'Import Data'
  end

  def stats
    @title = 'Statistics'
  end

  def review
    @title = 'Review'
    skip = params[:skip].to_i
    count = params[:count].to_i
    count = 10 if count <= 0 || count > 500
    @books = []
    search = Book
    if params[:cat]
      search = Category.find(params[:cat]).nominees
    end
    search
    .includes(:author).includes(:title)
    .includes(:contents).includes(:links)
    .order('RANDOM()')
    .limit(1000).each do |book|
      next if book.contents.any? # has data
      next if book.links.any? # has guess
      next if book.possible_filenames.empty? # no guesses
      next if (skip -= 1) > 0
      @books << book
      break if @books.size >= count
    end
  end

  def home; end

  def upload # Uploads in FF not Chrome
  end

  def paths;
    @title = 'Treework'
  end
end