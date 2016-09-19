import { container } from '@graphistry/falcor-react-redux';
import { Table, Alert } from 'react-bootstrap';
import PivotRow from './PivotRow';
//import PivotTable from './PivotTable';
import { table as tableClassName,
    tbody as tableBodyClassName,
    thead as tableHeaderClassName} from './styles.less';
import { ButtonGroup, Button, Glyphicon } from 'react-bootstrap'
import styles from './styles.less';
import { splicePivot,
        insertPivot,
        searchPivot,
        playInvestigation,
        dismissAlert
} from '../actions/investigation'

function renderInvestigation({length = 0, templates = 'all', status, name = 'default', pivots = [], searchPivot, insertPivot, splicePivot, dismissAlert, playInvestigation }) {
    const cellWidth = Math.round(88 / (4));
    return (
        <div className={styles.pivots}>
            { status ?
            <Alert bsStyle={status.type} className={styles.alert} onDismiss={dismissAlert}>
                <strong> {status.message} </strong>
            </Alert>
            : null
            }
            <Table>
                <thead>
                    <tr>
                    <th className={styles.pivotToggle}> 
                        <ButtonGroup vertical block style={{float:'left'}} >
                            <Button onClick={(ev) => playInvestigation({length: pivots.length})}><Glyphicon glyph="play-circle" /></Button>
                        </ButtonGroup>
                    </th>
                        <td className={styles.pivotData0 + ' pivotTypeSelector'}>Step</td>
                        <td colSpan="4" className={styles.pivotData1}>Parameters</td>
                        <td colSpan="2" className={styles.pivotResultCount}>Hits</td>
                    </tr>
                </thead>
                <tbody>
                    {pivots.map((pivot, index) => (
                        <PivotRow data={pivot}
                                  rowIndex={index}
                                  key={`${index}: ${pivot.id}`}
                                  searchPivot={searchPivot}
                                  splicePivot={splicePivot}
                                  insertPivot={insertPivot}/>

                    ))}
                </tbody>
            </Table>
        </div>
    );
}

function mapStateToFragment({selectedInvestigation = {}, length = 0, name = 'default'} = {}) {
    return `{
        'url', 'name', 'length', 'status', [0...${length}]: ${
            PivotRow.fragment()
        }
    }`;
}

function mapFragmentToProps(fragment) {
    const output =  { pivots: fragment, name: fragment.name, length: fragment.length,
        status: fragment.status};
    return output;
}

export default container(
    mapStateToFragment,
    mapFragmentToProps,
    {
        splicePivot: splicePivot,
        insertPivot: insertPivot,
        searchPivot: searchPivot,
        playInvestigation: playInvestigation,
        searchPivot: searchPivot,
    }
)(renderInvestigation)

