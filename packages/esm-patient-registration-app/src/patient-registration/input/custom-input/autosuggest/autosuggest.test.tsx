import React from 'react';
import { Autosuggest } from './autosuggest.component';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom';

const mockPersons = [
  {
    uuid: 'randomuuid1',
    display: 'John Doe',
  },
  {
    uuid: 'randomuuid2',
    display: 'John Smith',
  },
  {
    uuid: 'randomuuid3',
    display: 'James Smith',
  },
  {
    uuid: 'randomuuid4',
    display: 'Spider Man',
  },
];

const mockGetSearchResults = async (query: string) => {
  return mockPersons.filter((person) => {
    return person.display.toUpperCase().includes(query.toUpperCase());
  });
};

const handleSuggestionSelected = jest.fn((field, value) => [field, value]);

describe('autosuggest', () => {
  const setup = () => {
    render(
      <BrowserRouter>
        <Autosuggest
          labelText=""
          id="person"
          placeholder="Find Person"
          onSuggestionSelected={handleSuggestionSelected}
          getSearchResults={mockGetSearchResults}
          getDisplayValue={(item) => item.display}
          getFieldValue={(item) => item.uuid}
        />
      </BrowserRouter>,
    );
  };

  it('should render a search box', () => {
    setup();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('should show the search results in a list', async () => {
    setup();
    const searchbox = screen.getByRole('searchbox');
    fireEvent.change(searchbox, { target: { value: 'john' } });
    const list = await waitFor(() => screen.getByRole('list'));
    expect(list).toBeInTheDocument();
    expect(list.children).toHaveLength(2);
  });

  it('should creates the li items whose inner text is gotten through getDisplayValue', async () => {
    setup();
    const searchbox = screen.getByRole('searchbox');
    fireEvent.change(searchbox, { target: { value: 'john' } });
    const list = await waitFor(() => screen.getAllByRole('listitem'));
    expect(list[0].textContent).toBe('John Doe');
    expect(list[1].textContent).toBe('John Smith');
  });

  it('should trigger the onSuggestionSelected with correct values when li is clicked', async () => {
    setup();
    const searchbox = screen.getByRole('searchbox');
    fireEvent.change(searchbox, { target: { value: 'john' } });
    const listitems = await waitFor(() => screen.getAllByRole('listitem'));
    fireEvent.click(listitems[0]);
    expect(handleSuggestionSelected).toHaveBeenNthCalledWith(4, 'person', 'randomuuid1');
  });

  it('should clear the suggestions when a suggestion is selected', async () => {
    setup();
    let list = screen.queryByRole('list');
    expect(list).toBeNull();
    const searchbox = screen.getByRole('searchbox');
    fireEvent.change(searchbox, { target: { value: 'john' } });
    list = await waitFor(() => screen.getByRole('list'));
    expect(list).toBeInTheDocument();
    const listitems = screen.getAllByRole('listitem');
    fireEvent.click(listitems[0]);
    list = screen.queryByRole('list');
    expect(list).toBeNull();
  });

  it('should change suggestions when a search input is changed', async () => {
    setup();
    let list = screen.queryByRole('list');
    expect(list).toBeNull();
    const searchbox = screen.getByRole('searchbox');
    fireEvent.change(searchbox, { target: { value: 'john' } });
    const suggestion = await screen.findByText('John Doe');
    expect(suggestion).toBeInTheDocument();
    fireEvent.change(searchbox, { target: { value: '' } });
    list = screen.queryByRole('list');
    expect(list).toBeNull();
  });

  it('should hide suggestions when clicked outside of component', async () => {
    setup();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'john' } });
    await screen.findByText('John Doe');
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
});
