class DirectoriesController < ApplicationController
  before_action :set_directory, only: [:show, :edit, :update, :destroy]

  # GET /directories
  # GET /directories.json
  def index
    @directories = Directory.all
    @title = 'Dirs'
    if params[:server]
      @server = Server.find(params[:server])
      @directories = @server.directories.distinct
      @title += "@#{@server.name}"
    end
    if params[:match]
      @directories = @directories.where(
        'name ILIKE ?', "%#{params[:match]}%"
      )
    end
    @directories = @directories.page(params[:page])
  end

  # GET /directories/1
  # GET /directories/1.json
  def show
    @title = "Dir: #{params[:id]}"
  end

  # GET /directories/new
  def new
    @directory = Directory.new
  end

  # GET /directories/1/edit
  def edit
  end

  # POST /directories
  # POST /directories.json
  def create
    @directory = Directory.new(directory_params)

    respond_to do |format|
      if @directory.save
        format.html { redirect_to @directory, notice: 'Directory was successfully created.' }
        format.json { render :show, status: :created, location: @directory }
      else
        format.html { render :new }
        format.json { render json: @directory.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /directories/1
  # PATCH/PUT /directories/1.json
  def update
    respond_to do |format|
      if @directory.update(directory_params)
        format.html { redirect_to @directory, notice: 'Directory was successfully updated.' }
        format.json { render :show, status: :ok, location: @directory }
      else
        format.html { render :edit }
        format.json { render json: @directory.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /directories/1
  # DELETE /directories/1.json
  def destroy
    @directory.destroy
    respond_to do |format|
      format.html { redirect_to directories_url, notice: 'Directory was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_directory
      @directory = Directory.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def directory_params
      params.require(:directory).permit(:name)
    end
end
