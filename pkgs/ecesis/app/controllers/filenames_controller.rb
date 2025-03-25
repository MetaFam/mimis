class FilenamesController < ApplicationController
  before_action :set_filename, only: [:show, :edit, :update, :destroy]

  # GET /filenames
  # GET /filenames.json
  def index
    @title = 'Filenames'
    @filenames = Filename.all
    
    if match = params[:contains] || params[:match]
      @filenames = @filenames.where(
        'name ILIKE ?', "%#{match}%"
      )
    end

    @filenames = (
      @filenames
      .order(:name)
      .page(params[:page])
      .per(params[:per_page])
    )
  end

  # GET /filenames/1
  # GET /filenames/1.json
  def show
  end

  # GET /filenames/new
  def new
    @filename = Filename.new
  end

  # GET /filenames/1/edit
  def edit
  end

  # POST /filenames
  # POST /filenames.json
  def create
    @filename = Filename.new(filename_params)

    respond_to do |format|
      if @filename.save
        format.html { redirect_to @filename, notice: 'Filename was successfully created.' }
        format.json { render :show, status: :created, location: @filename }
      else
        format.html { render :new }
        format.json { render json: @filename.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /filenames/1
  # PATCH/PUT /filenames/1.json
  def update
    respond_to do |format|
      if @filename.update(filename_params)
        format.html { redirect_to @filename, notice: 'Filename was successfully updated.' }
        format.json { render :show, status: :ok, location: @filename }
      else
        format.html { render :edit }
        format.json { render json: @filename.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /filenames/1
  # DELETE /filenames/1.json
  def destroy
    @filename.destroy
    respond_to do |format|
      format.html { redirect_to filenames_url, notice: 'Filename was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_filename
      @filename = Filename.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def filename_params
      params.require(:filename).permit(:name)
    end
end
