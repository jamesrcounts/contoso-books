import React from 'react';
import { Routes } from './Routes';
import { NavBar } from './NavBar';
import { useNavbarFilters } from './useNavbarFilters';
import { toggleListItem, toggleRating } from './filterHelpers';

function App() {
  const {rating, setRating, format, setFormat, searchText, setSearchText, genre, setGenre} = useNavbarFilters();

  const handleRating = (ratinginput) => {
    setRating((old) => toggleRating(old, ratinginput));
  }

  const handleFormat = (formatinput) => {
    setFormat((old) => toggleListItem(old, formatinput));
  }

  const handleGenre = (genreinput) => {
    setGenre((old) => toggleListItem(old, genreinput));
  }

  const handleSearch = (searchTextInput) => {
    setSearchText(searchTextInput);
  }

  return (
    <main className="wrapper">
      <NavBar rating={rating} format={format} genre={genre} handleRating={(input)=> handleRating(input)} handleFormat={(e)=>handleFormat(e)} handleSearch={(input)=>handleSearch(input)} handleGenre={(e)=>handleGenre(e)}/>
      <Routes rating={rating} format={format} genre={genre} searchText={searchText}/>
    </main>
  );
}

export default App;
