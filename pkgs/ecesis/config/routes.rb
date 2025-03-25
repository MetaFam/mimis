Rails.application.routes.draw do
  root 'pages#home'

  get '/import' => 'pages#import'
  post '/import' => 'pages#upload'
  get '/stats' => 'pages#stats'
  get '/search' => 'pages#search'
  post '/search' => 'search#complete'
  get '/review' => 'pages#review'
  get '/paths' => 'pages#paths'
  
  resources :paths
  resources :links
  resources :contents

  resources :data
  resources :shares
  resources :servers
  resources :filenames
  resources :directories
  resources :source_strings
  resources :entries

  resources :books_categories
  resources :books
  resources :titles
  resources :categories
  resources :years
  resources :awards
  resources :authors
end
