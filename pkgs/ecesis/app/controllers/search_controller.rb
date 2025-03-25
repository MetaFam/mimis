class SearchController < ApplicationController
  protect_from_forgery with: :null_session

  def complete
    @filenames = Filename
    .where('name ILIKE ?', "%#{params[:partial]}%")
    .distinct
    .includes(:shares)
    .limit(50)

    @suggestions = @filenames.map do |n|
      {
        text: n.name,
        url: (
          n.shares.any? ? share_path(n.shares.first) : filename_path(n)
        ),
      }
    end

    render json: @suggestions
  end
end
